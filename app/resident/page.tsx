"use client";

import { useState, useEffect } from "react";import { useI18n } from "@/lib/i18n/context";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ProductShell } from "@/components/ProductShell";
import { useAuth } from "@/providers/AuthProvider";
import { saveResidentOnboardingAction } from "@/features/user/actions";
import { Typography } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Sparkles,
  Map as MapIcon,
  Award,
  Shield,
  Lock,
  AlertTriangle,
  Loader2 } from
"lucide-react";
import {
  createBookingAction,
  releaseBookingPayoutAction,
  disputeBookingAction,
  getBookingsAction,
  getWorkersAction,
  BookingResponse,
  WorkerProfileResponse } from
"@/features/booking/actions";

const MapView = dynamic(
  () => import("@/components/maps/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () =>
    <div className="w-full h-[550px] rounded-3xl overflow-hidden border border-primary/10 shadow-xl bg-card flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Loading interactive neighborhood map...</span>
      </div>

  }
);

export default function ResidentDashboardPage() {const { t: i18nT } = useI18n();
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Onboarding state
  const [savedAddress, setSavedAddress] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  // Dashboard dynamic states
  const [workers, setWorkers] = useState<WorkerProfileResponse[]>([]);
  const [bookings, setBookings] = useState<BookingResponse[]>([]);

  const loadData = async () => {
    try {
      const workersRes = await getWorkersAction();
      if (workersRes.success && workersRes.data) {
        setWorkers(workersRes.data);
      }
      const bookingsRes = await getBookingsAction();
      if (bookingsRes.success && bookingsRes.data) {
        setBookings(bookingsRes.data);
      }
    } catch (err: unknown) {
      console.error("Failed to load resident dashboard dataset:", err);
    }
  };

  useEffect(() => {
    if (user && user.residentOnboardingCompleted) {
      loadData();
    }
  }, [user]);

  if (!user) return null;

  if (!user.residentOnboardingCompleted) {
    const handleOnboardingSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setErrorMsg(null);
      try {
        const result = await saveResidentOnboardingAction({
          savedAddress,
          preferredLanguage,
          paymentMethod
        });
        if (!result.success) {
          throw new Error(result.error.message);
        }
        await updateProfile({
          savedAddress,
          preferredLanguage,
          paymentMethod,
          residentOnboardingCompleted: true
        });
        setSuccessMessage("Onboarding profile saved successfully!");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to save onboarding details.";
        setErrorMsg(message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <ProductShell>
        <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 px-4">
          <Card className="glass-card w-full max-w-md p-6 flex flex-col gap-6 shadow-2xl">
            <div className="text-center">
              <span className="w-12 h-12 rounded-full bg-linear-to-r from-amber-500 to-amber-600 flex items-center justify-center text-background font-extrabold text-lg mx-auto shadow-md mb-3">{i18nT("JN")}

              </span>
              <Typography variant="h3" className="font-bold gold-gradient-text">{i18nT("Resident Onboarding")}</Typography>
              <Typography variant="muted" className="text-xs mt-1">{i18nT("Complete your details to start booking nearby services.")}

              </Typography>
            </div>

            <form onSubmit={handleOnboardingSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground/80">{i18nT("Saved Home Address")}</label>
                <textarea
                  required
                  value={savedAddress}
                  onChange={(e) => setSavedAddress(e.target.value)}
                  placeholder={i18nT("Enter your complete home address (district, city, pincode)")}
                  className="p-3 bg-secondary/30 border border-border rounded-xl text-xs text-foreground focus:outline-hidden focus:border-primary/50 min-h-[80px]" />
                
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground/80">{i18nT("Preferred Communication Language")}</label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="p-3 bg-secondary/30 border border-border rounded-xl text-xs text-foreground focus:outline-hidden focus:border-primary/50">
                  
                  <option value="English">{i18nT("English")}</option>
                  <option value="Hindi">{i18nT("Hindi / हिंदी")}</option>
                  <option value="Telugu">{i18nT("Telugu / తెలుగు")}</option>
                  <option value="Tamil">{i18nT("Tamil / தமிழ்")}</option>
                  <option value="Kannada">{i18nT("Kannada / కన్నడ")}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground/80">{i18nT("Default Payment Method")}</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="p-3 bg-secondary/30 border border-border rounded-xl text-xs text-foreground focus:outline-hidden focus:border-primary/50">
                  
                  <option value="UPI">{i18nT("UPI (Google Pay, PhonePe, Paytm)")}</option>
                  <option value="Card">{i18nT("Credit or Debit Card")}</option>
                  <option value="NetBanking">{i18nT("Net Banking")}</option>
                  <option value="Cash">{i18nT("Cash on Delivery")}</option>
                </select>
              </div>

              {errorMsg &&
              <div className="p-3 bg-red-950/60 border border-red-500/30 text-red-300 text-xs rounded-xl">
                  {errorMsg}
                </div>
              }

              <Button variant="primary" type="submit" className="w-full mt-2" isLoading={loading}>{i18nT("Complete Resident Onboarding")}

              </Button>
            </form>
          </Card>
        </div>
      </ProductShell>);

  }

  const handleBookHandyman = async (workerId: string, serviceType: string, price: number) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await createBookingAction({
        workerId,
        serviceType,
        price,
        description: `Handyman service request for ${serviceType}.`
      });
      if (!res.success) {
        throw new Error(res.error?.message || "Booking creation failed.");
      }
      setSuccessMessage(`Booking request registered for ${serviceType}! Escrow funds locked.`);
      await loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Booking failed.";
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseDispute = async (bookingId: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await disputeBookingAction(bookingId, "Service parameters dispute raised by resident.");
      if (!res.success) {
        throw new Error(res.error?.message || "Dispute request failed.");
      }
      setSuccessMessage("Dispute raised. Safety audit team notified.");
      await loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Dispute failed.";
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayout = async (bookingId: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await releaseBookingPayoutAction(bookingId);
      if (!res.success) {
        throw new Error(res.error?.message || "Payout release transaction failed.");
      }
      setSuccessMessage("Escrow funds released successfully to worker wallet!");
      await loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payout release failed.";
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProductShell>
      <div className="flex flex-col gap-6">
        <Typography variant="h2" className="font-bold gold-gradient-text">{i18nT("Book Local Services")}</Typography>
        
        {/* Categories Grid */}
        <div id="book-services" className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
          {["Plumber", "Electrician", "Farmer Help", "Carpenter"].map((cat) =>
          <button
            key={cat}
            onClick={() => {
              router.push(`/ai?q=${encodeURIComponent(`Find me a ${cat.toLowerCase()} within 3 km`)}`);
            }}
            className="p-5 bg-card/50 border border-border rounded-xl text-center hover:border-primary/30 transition-all hover:scale-102 flex flex-col items-center justify-center gap-3 cursor-pointer">
            
              <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </span>
              <span className="text-sm font-semibold">{cat}</span>
            </button>
          )}
        </div>

        {/* Resident Home Help Map */}
        <div className="flex flex-col gap-4">
          <Typography variant="h3" className="font-bold flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-primary" />{i18nT("Home Help & Services Map")}

          </Typography>
          <MapView mode="resident" />
        </div>

        {successMessage &&
        <div className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg text-xs font-semibold">
            {successMessage}
          </div>
        }

        {errorMsg &&
        <div className="bg-red-950/80 border border-red-500/30 text-red-300 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg text-xs font-semibold">
            {errorMsg}
          </div>
        }

        {/* Nearby Service Providers Cards List */}
        <div className="flex flex-col gap-4">
          <Typography variant="h3" className="font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />{i18nT("Nearby Available Handymen & Service Providers")}

          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workers.slice(0, 3).map((w) =>
            <div key={w.user_id} className="p-4 bg-card/60 border border-border rounded-xl flex flex-col justify-between gap-3 hover:border-primary/30 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-primary">
                      {w.full_name?.substring(0, 2).toUpperCase() || "HM"}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground block">{w.full_name}</span>
                      <span className="text-[10px] text-muted-foreground">{w.job_title} • {w.experience_years}{i18nT("y experience")}</span>
                    </div>
                  </div>
                  <Badge variant="primary" className="text-[9px]">{i18nT("95% Trust")}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">{w.bio}</p>
                <div className="flex justify-between items-center mt-1 border-t border-border/40 pt-2">
                  <span className="text-xs font-mono font-bold text-emerald-400">₹{w.expected_salary}{i18nT("/day")}</span>
                  <Button
                  variant="primary"
                  size="sm"
                  className="h-7 px-3 text-[10px] rounded-lg"
                  isLoading={loading}
                  onClick={() => handleBookHandyman(w.user_id, w.job_title, w.expected_salary)}>{i18nT("Book Now")}


                </Button>
                </div>
              </div>
            )}

            {workers.length === 0 &&
            <div className="col-span-3 text-center py-6 text-xs text-muted-foreground bg-card/10 border border-dashed border-border rounded-xl">{i18nT("No active registered service providers found in this sector.")}

            </div>
            }
          </div>
        </div>

        {/* Resident Bookings & Escrow Manager */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch my-4">
          <Card className="glass-card p-5 lg:col-span-2 flex flex-col justify-between">
            <div>
              <Typography variant="h3" className="font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />{i18nT("Active Escrow Safety Manager")}

              </Typography>
              <Typography variant="muted" className="text-xs mt-1">{i18nT("Protect payments. Funds are locked securely in the escrow ledger and released only after you verify the completed task.")}

              </Typography>
            </div>

            <div className="flex flex-col gap-3 my-4">
              {bookings.filter((b) => ["pending", "in_progress", "completed"].includes(b.status)).map((b) =>
              <div key={b.id} className="p-4 bg-secondary/40 border border-border rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </span>
                    <div>
                      <span className="text-xs font-bold block">{i18nT("Job:")}{b.service_type} ({b.status})</span>
                      <span className="text-[10px] text-muted">{i18nT("Contractor:")}{wName(wList(b.worker))}{i18nT("• Locked: ₹")}{b.price}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleRaiseDispute(b.id)}>{i18nT("Raise Dispute")}</Button>
                    {b.status === "completed" &&
                  <Button variant="primary" size="sm" onClick={() => handleReleasePayout(b.id)}>{i18nT("Release Payout")}</Button>
                  }
                  </div>
                </div>
              )}

              {bookings.filter((b) => ["pending", "in_progress", "completed"].includes(b.status)).length === 0 &&
              <div className="text-center py-6 text-xs text-muted-foreground bg-secondary/10 border border-dashed border-border rounded-xl">{i18nT("No active bookings or funded escrows.")}

              </div>
              }
            </div>

            <div className="text-[10px] text-muted flex gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-primary" />
              <span>{i18nT("JobNest guarantees 100% resolution checks under SLA protocols.")}</span>
            </div>
          </Card>

          <Card className="glass-card p-5 flex flex-col justify-between">
            <Typography variant="h4" className="font-bold">{i18nT("Bookings History")}</Typography>
            <div className="flex flex-col gap-3 my-4">
              {bookings.filter((b) => ["resolved", "disputed"].includes(b.status)).map((b) =>
              <div key={b.id} className="flex justify-between items-center text-xs pb-1 border-b border-border">
                  <span>{b.service_type}</span>
                  <span className={`font-semibold ${b.status === "resolved" ? "text-emerald-400" : "text-red-400"}`}>{b.status}</span>
                </div>
              )}

              {bookings.filter((b) => ["resolved", "disputed"].includes(b.status)).length === 0 &&
              <div className="text-center py-6 text-xs text-muted-foreground">{i18nT("No past resolved contracts.")}

              </div>
              }
            </div>
            <Button variant="outline" size="sm" className="w-full">{i18nT("View Receipts Ledger")}</Button>
          </Card>
        </div>
      </div>
    </ProductShell>);

}

// Helpers to resolve type warnings
interface ProfileRef {
  display_name?: string | null;
  full_name?: string | null;
}

function wList(w: unknown): ProfileRef | null {
  return w as ProfileRef | null;
}

function wName(p: ProfileRef | null): string {
  return p?.display_name || p?.full_name || "Handyman";
}