"use server";

import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { runWithRequestContext } from "@/lib/observability/request-context-helper";
import { logRequestLifecycle } from "@/lib/observability/request-logger";
import { ActionResult } from "@/features/auth/actions";

const createBookingSchema = z.object({
  workerId: z.string().uuid("Invalid worker ID format."),
  serviceType: z.string().min(2, "Service type is required."),
  price: z.number().positive("Price must be greater than zero."),
  description: z.string().optional()
});

async function executeAction<T>(
  actionName: string,
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  return runWithRequestContext(async () => {
    return logRequestLifecycle(actionName, async (): Promise<ActionResult<T>> => {
      try {
        const data = await fn();
        return { success: true, data };
      } catch (error) {
        if (error instanceof z.ZodError) {
          const details = error.flatten().fieldErrors;
          return {
            success: false,
            error: {
              code: "VALIDATION_FAILED",
              message: "Input validation failed.",
              details,
            },
          };
        }

        return {
          success: false,
          error: {
            code: error instanceof Error ? error.name : "UNKNOWN_ERROR",
            message: error instanceof Error ? error.message : "An unexpected failure occurred.",
          },
        };
      }
    });
  });
}

/**
 * Initiates a local handyman booking by resident, locks booking cost in escrow.
 */
export async function createBookingAction(formData: unknown): Promise<ActionResult<{ bookingId: string; roomId: string }>> {
  return executeAction("createBookingAction", async () => {
    const validated = createBookingSchema.parse(formData);
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const residentId = user.id;
    const workerId = validated.workerId;
    const price = validated.price;

    // 1. Verify resident has sufficient balance
    const { data: resWallet, error: walletErr } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", residentId)
      .single();

    if (walletErr || !resWallet) {
      throw new Error("Could not load wallet details. Please try again.");
    }

    if (Number(resWallet.balance) < price) {
      throw new Error(`Insufficient wallet balance. Price: ₹${price}. Balance: ₹${resWallet.balance}.`);
    }

    // 2. Create the booking entry in database
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .insert({
        resident_id: residentId,
        worker_id: workerId,
        service_type: validated.serviceType,
        price,
        description: validated.description || null,
        status: "pending"
      })
      .select("id")
      .single();

    if (bookingErr || !booking) {
      throw bookingErr || new Error("Failed to register booking.");
    }

    // 3. Lock resident's funds in wallet balance atomically
    const { error: lockErr } = await supabase.rpc("adjust_wallet_balance", {
      p_user_id: residentId,
      p_amount: -price,
      p_locked_amount: price
    });

    if (lockErr) throw lockErr;

    // 4. Create the escrow contract entry linked to booking_id
    const commission = parseFloat((price * 0.05).toFixed(2));
    const { data: escrow, error: escrowErr } = await supabase
      .from("escrows")
      .insert({
        booking_id: booking.id,
        payer_id: residentId,
        payee_id: workerId,
        amount: price,
        commission_amount: commission,
        status: "funded"
      })
      .select("id")
      .single();

    if (escrowErr || !escrow) {
      // rollback lock
      await supabase.rpc("adjust_wallet_balance", {
        p_user_id: residentId,
        p_amount: price,
        p_locked_amount: -price
      });
      throw escrowErr || new Error("Failed to fund escrow contract.");
    }

    // 5. Setup / Retrieve booking chat room
    let roomId: string;
    const { data: existingRoom } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("employer_id", residentId)
      .eq("worker_id", workerId)
      .is("opportunity_id", null)
      .maybeSingle();

    if (existingRoom) {
      roomId = existingRoom.id;
    } else {
      const { data: room, error: roomErr } = await supabase
        .from("chat_rooms")
        .insert({
          employer_id: residentId,
          worker_id: workerId,
          opportunity_id: null,
          metadata: { type: "booking" }
        })
        .select("id")
        .single();
      if (roomErr || !room) throw roomErr || new Error("Failed to create chat channel.");
      roomId = room.id;
    }

    // 6. Push initial system messages
    await supabase.from("chat_messages").insert({
      room_id: roomId,
      sender_id: residentId,
      message_type: "system",
      content: `Booking created for ${validated.serviceType}. Escrow funds of ₹${price} locked safely.`,
      delivery_status: "sent"
    });

    // 7. Record transaction in wallet history and double-entry ledgers
    const txId = crypto.randomUUID();
    await supabase.from("wallet_transactions").insert({
      id: txId,
      wallet_id: resWallet.id,
      amount: price,
      type: "debit",
      category: "escrow_hold",
      reference_id: escrow.id,
      description: `Funded reservation escrow for ${validated.serviceType} booking.`
    });

    await supabase.from("ledger_entries").insert([
      { account_id: residentId, amount: price, type: "debit", transaction_id: txId, reference_type: "escrow_hold" },
      { account_id: null, amount: price, type: "credit", transaction_id: txId, reference_type: "escrow_hold" }
    ]);

    // 8. Dispatch notification event
    try {
      await supabase.from("realtime_events_queue").insert({
        user_id: workerId,
        event_type: "booking_created",
        payload: {
          message: `New booking request from resident for ${validated.serviceType}.`,
          bookingId: booking.id,
          price
        }
      });
    } catch (notifErr) {
      console.warn("Realtime dispatch failed:", notifErr);
    }

    return { bookingId: booking.id, roomId };
  });
}

/**
 * Worker accepts the pending resident booking.
 */
export async function acceptBookingAction(bookingId: string): Promise<ActionResult<void>> {
  return executeAction("acceptBookingAction", async () => {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) throw fetchErr || new Error("Booking not found.");
    if (booking.worker_id !== user.id) throw new Error("Access denied: Not authorized worker.");
    if (booking.status !== "pending") throw new Error("Booking is not in pending status.");

    const { error: updateErr } = await supabase
      .from("bookings")
      .update({ status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", bookingId);

    if (updateErr) throw updateErr;

    // Send chat system message
    const { data: room } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("employer_id", booking.resident_id)
      .eq("worker_id", booking.worker_id)
      .is("opportunity_id", null)
      .single();

    if (room) {
      await supabase.from("chat_messages").insert({
        room_id: room.id,
        sender_id: user.id,
        message_type: "system",
        content: "Worker accepted booking request. Work is now in progress.",
        delivery_status: "sent"
      });
    }

    // Queue notification event
    try {
      await supabase.from("realtime_events_queue").insert({
        user_id: booking.resident_id,
        event_type: "booking_accepted",
        payload: {
          message: "Worker accepted your booking request.",
          bookingId
        }
      });
    } catch (notifErr) {
      console.warn("Notification dispatch failed:", notifErr);
    }
  });
}

/**
 * Worker signals task completion.
 */
export async function completeBookingAction(bookingId: string): Promise<ActionResult<void>> {
  return executeAction("completeBookingAction", async () => {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) throw fetchErr || new Error("Booking not found.");
    if (booking.worker_id !== user.id) throw new Error("Access denied: Not authorized worker.");
    if (booking.status !== "in_progress") throw new Error("Booking is not in progress.");

    const { error: updateErr } = await supabase
      .from("bookings")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", bookingId);

    if (updateErr) throw updateErr;

    // Chat update
    const { data: room } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("employer_id", booking.resident_id)
      .eq("worker_id", booking.worker_id)
      .is("opportunity_id", null)
      .single();

    if (room) {
      await supabase.from("chat_messages").insert({
        room_id: room.id,
        sender_id: user.id,
        message_type: "system",
        content: "Worker marked the task as completed. Releasing payout pending resident verification.",
        delivery_status: "sent"
      });
    }

    // Realtime notification
    try {
      await supabase.from("realtime_events_queue").insert({
        user_id: booking.resident_id,
        event_type: "booking_completed",
        payload: {
          message: "Worker completed booking. Click to verify and release payment.",
          bookingId
        }
      });
    } catch (notifErr) {
      console.warn("Notification dispatch failed:", notifErr);
    }
  });
}

/**
 * Resident approves completion and releases funds from escrow to worker balance.
 */
export async function releaseBookingPayoutAction(bookingId: string): Promise<ActionResult<void>> {
  return executeAction("releaseBookingPayoutAction", async () => {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) throw fetchErr || new Error("Booking not found.");
    if (booking.resident_id !== user.id) throw new Error("Access denied: Not authorized resident.");
    if (booking.status !== "completed") throw new Error("Booking tasks are not marked completed.");

    // Fetch escrow contract details
    const { data: escrow, error: escErr } = await supabase
      .from("escrows")
      .select("*")
      .eq("booking_id", bookingId)
      .eq("status", "funded")
      .single();

    if (escErr || !escrow) throw escErr || new Error("Active funded escrow contract not found.");

    const price = Number(escrow.amount);
    const commission = Number(escrow.commission_amount);
    const workerPayout = price - commission;

    // 1. Release escrow funds atomically
    // Deduct locked amount from payer
    const { error: adjustPayer } = await supabase.rpc("adjust_wallet_balance", {
      p_user_id: booking.resident_id,
      p_amount: 0.00,
      p_locked_amount: -price
    });
    if (adjustPayer) throw adjustPayer;

    // Credit payout amount to payee
    const { error: adjustPayee } = await supabase.rpc("adjust_wallet_balance", {
      p_user_id: booking.worker_id,
      p_amount: workerPayout,
      p_locked_amount: 0.00
    });
    if (adjustPayee) throw adjustPayee;

    // Update escrow contract status
    await supabase
      .from("escrows")
      .update({ status: "released", released_amount: price, updated_at: new Date().toISOString() })
      .eq("id", escrow.id);

    // Update booking status
    await supabase
      .from("bookings")
      .update({ status: "resolved", updated_at: new Date().toISOString() })
      .eq("id", bookingId);

    // 2. Log transactions for worker
    const { data: workerWallet } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", booking.worker_id)
      .single();

    if (workerWallet) {
      const txId = crypto.randomUUID();
      await supabase.from("wallet_transactions").insert({
        id: txId,
        wallet_id: workerWallet.id,
        amount: workerPayout,
        type: "credit",
        category: "escrow_release",
        reference_id: escrow.id,
        description: `Payout payout release for booking: ${booking.service_type}`
      });

      await supabase.from("ledger_entries").insert([
        { account_id: null, amount: workerPayout, type: "debit", transaction_id: txId, reference_type: "escrow_release" },
        { account_id: booking.worker_id, amount: workerPayout, type: "credit", transaction_id: txId, reference_type: "escrow_release" }
      ]);
    }

    // 3. System chat notification
    const { data: room } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("employer_id", booking.resident_id)
      .eq("worker_id", booking.worker_id)
      .is("opportunity_id", null)
      .single();

    if (room) {
      await supabase.from("chat_messages").insert({
        room_id: room.id,
        sender_id: user.id,
        message_type: "system",
        content: `Escrow funds of ₹${price} released. Worker payout ₹${workerPayout} credited successfully.`,
        delivery_status: "sent"
      });
    }

    // Realtime notification
    try {
      await supabase.from("realtime_events_queue").insert({
        user_id: booking.worker_id,
        event_type: "booking_payout_released",
        payload: {
          message: `Payout for ${booking.service_type} released to your balance!`,
          bookingId
        }
      });
    } catch (notifErr) {
      console.warn("Notification dispatch failed:", notifErr);
    }
  });
}

/**
 * Resident raises a dispute on a completed/in-progress booking.
 */
export async function disputeBookingAction(
  bookingId: string,
  reason: string
): Promise<ActionResult<void>> {
  return executeAction("disputeBookingAction", async () => {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) throw fetchErr || new Error("Booking not found.");
    if (booking.resident_id !== user.id && booking.worker_id !== user.id) {
      throw new Error("Access denied: Not authorized participant.");
    }

    await supabase
      .from("bookings")
      .update({ status: "disputed", updated_at: new Date().toISOString() })
      .eq("id", bookingId);

    // Update escrow status to held/disputed
    await supabase
      .from("escrows")
      .update({ status: "held", updated_at: new Date().toISOString() })
      .eq("booking_id", bookingId);

    // Create dispute audit entry
    await supabase.from("disputes").insert({
      opportunity_id: null,
      initiator_id: user.id,
      respondent_id: user.id === booking.resident_id ? booking.worker_id : booking.resident_id,
      reason: reason || "Handyman services dispute.",
      description: `Disputed booking ${bookingId} for service: ${booking.service_type}`,
      status: "open"
    });

    // Chat system notification
    const { data: room } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("employer_id", booking.resident_id)
      .eq("worker_id", booking.worker_id)
      .is("opportunity_id", null)
      .single();

    if (room) {
      await supabase.from("chat_messages").insert({
        room_id: room.id,
        sender_id: user.id,
        message_type: "system",
        content: `Dispute raised on this booking by ${user.id === booking.resident_id ? "Resident" : "Worker"}. Escrow funds held. Admin audit initiated.`,
        delivery_status: "sent"
      });
    }

    // Realtime notification
    try {
      await supabase.from("realtime_events_queue").insert({
        user_id: user.id === booking.resident_id ? booking.worker_id : booking.resident_id,
        event_type: "booking_disputed",
        payload: {
          message: "Dispute raised on active handyman booking.",
          bookingId
        }
      });
    } catch (notifErr) {
      console.warn("Notification dispatch failed:", notifErr);
    }
  });
}

export interface BookingResponse {
  id: string;
  resident_id: string;
  worker_id: string;
  service_type: string;
  price: number;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  worker: {
    id: string;
    display_name: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  resident: {
    id: string;
    display_name: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  escrows: {
    id: string;
    status: string;
    amount: number;
    commission_amount: number;
  } | null;
}

/**
 * Retrieves bookings history for active user.
 */
export async function getBookingsAction(): Promise<ActionResult<BookingResponse[]>> {
  return executeAction("getBookingsAction", async () => {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        resident_id,
        worker_id,
        service_type,
        price,
        status,
        description,
        created_at,
        updated_at,
        worker:worker_id (
          id,
          display_name,
          phone,
          avatar_url
        ),
        resident:resident_id (
          id,
          display_name,
          phone,
          avatar_url
        ),
        escrows (
          id,
          status,
          amount,
          commission_amount
        )
      `)
      .or(`resident_id.eq.${user.id},worker_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    const rawList = (data || []) as unknown as Array<{
      id: string;
      resident_id: string;
      worker_id: string;
      service_type: string;
      price: number;
      status: string;
      description: string | null;
      created_at: string;
      updated_at: string;
      worker: unknown;
      resident: unknown;
      escrows: unknown;
    }>;

    return rawList.map((item) => {
      const wList = item.worker as Array<{ id: string; display_name: string | null; phone: string | null; avatar_url: string | null }>;
      const rList = item.resident as Array<{ id: string; display_name: string | null; phone: string | null; avatar_url: string | null }>;
      const eList = item.escrows as Array<{ id: string; status: string; amount: number; commission_amount: number }>;

      return {
        id: item.id,
        resident_id: item.resident_id,
        worker_id: item.worker_id,
        service_type: item.service_type,
        price: Number(item.price),
        status: item.status,
        description: item.description,
        created_at: item.created_at,
        updated_at: item.updated_at,
        worker: wList && wList.length > 0 ? wList[0] : null,
        resident: rList && rList.length > 0 ? rList[0] : null,
        escrows: eList && eList.length > 0 ? eList[0] : null
      };
    });
  });
}

export interface WorkerProfileResponse {
  user_id: string;
  job_title: string;
  experience_years: number;
  bio: string;
  expected_salary: number;
  availability: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

/**
 * Retrieves all registered workers.
 */
export async function getWorkersAction(): Promise<ActionResult<WorkerProfileResponse[]>> {
  return executeAction("getWorkersAction", async () => {
    const supabase = await createServerClient();
    const { data: workers, error } = await supabase
      .from("worker_profiles")
      .select(`
        user_id,
        job_title,
        experience_years,
        bio,
        expected_salary,
        availability,
        profiles:user_id (
          full_name,
          phone,
          avatar_url
        )
      `);

    if (error) throw error;

    const list = (workers || []) as unknown as Array<{
      user_id: string;
      job_title: string;
      experience_years: number;
      bio: string;
      expected_salary: number;
      availability: string;
      profiles: Array<{ full_name: string | null; phone: string | null; avatar_url: string | null }>;
    }>;

    return list.map((w) => {
      const p = w.profiles && w.profiles.length > 0 ? w.profiles[0] : null;
      return {
        user_id: w.user_id,
        job_title: w.job_title,
        experience_years: w.experience_years,
        bio: w.bio,
        expected_salary: Number(w.expected_salary || 400),
        availability: w.availability,
        full_name: p?.full_name || "Handyman Worker",
        phone: p?.phone || "",
        avatar_url: p?.avatar_url || ""
      };
    });
  });
}
