import { createServerClient } from "@/lib/supabase/server";
import { LedgerService } from "./ledger-service";
import { logger } from "@/services/logger";

/**
 * Wallet Balance Engine.
 * Processes active balances, locks, releases, and updates with double-entry audit trails.
 * Leverages database-level atomic operations and row locking to prevent concurrent race conditions.
 */
export class WalletEngine {
  /**
   * Credits a user's wallet.
   */
  static async credit(
    userId: string,
    amount: number,
    category: "payment" | "refund" | "reward_bonus" | "cashback" | "escrow_release",
    referenceId: string,
    description: string
  ): Promise<{ success: boolean; newBalance: number }> {
    try {
      const supabase = await createServerClient();

      // 1. Call atomic database RPC function to safely credit the balance
      const { data, error: rpcErr } = await supabase.rpc("adjust_wallet_balance", {
        p_user_id: userId,
        p_amount: amount,
        p_locked_amount: 0.00,
      });

      if (rpcErr || !data || data.length === 0 || !data[0].success) {
        throw rpcErr || new Error("Atomic wallet credit operation failed.");
      }

      const newBalance = Number(data[0].new_balance);

      // 2. Fetch the wallet ID for transaction mapping
      const { data: wallet } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!wallet) throw new Error("Wallet not found after credit adjustment.");

      // 3. Log transaction
      const txId = crypto.randomUUID();
      await supabase.from("wallet_transactions").insert({
        id: txId,
        wallet_id: wallet.id,
        amount,
        type: "credit",
        category,
        reference_id: referenceId,
        description,
      });

      // 4. Double-Entry ledger write
      await LedgerService.recordDoubleEntry(
        txId,
        { accountId: null, amount, referenceType: "payment" }, // Debit Platform
        { accountId: userId, amount, referenceType: "payment" } // Credit User
      );

      logger.info(`[WalletEngine] Credited ${amount} INR to user ${userId}. New balance: ${newBalance}`);
      return { success: true, newBalance };
    } catch (err) {
      logger.error(`[WalletEngine] Credit operation failure for user ${userId}:`, err as Record<string, unknown>);
      throw err;
    }
  }

  /**
   * Debits a user's wallet.
   */
  static async debit(
    userId: string,
    amount: number,
    category: "payout" | "escrow_hold" | "commission",
    referenceId: string,
    description: string
  ): Promise<{ success: boolean; newBalance: number }> {
    try {
      const supabase = await createServerClient();

      // 1. Call atomic database RPC function to safely debit the balance
      const { data, error: rpcErr } = await supabase.rpc("adjust_wallet_balance", {
        p_user_id: userId,
        p_amount: -amount,
        p_locked_amount: 0.00,
      });

      if (rpcErr || !data || data.length === 0 || !data[0].success) {
        throw rpcErr || new Error("Atomic wallet debit operation failed.");
      }

      const newBalance = Number(data[0].new_balance);

      // 2. Fetch the wallet ID for transaction mapping
      const { data: wallet } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!wallet) throw new Error("Wallet not found after debit adjustment.");

      // 3. Log transaction
      const txId = crypto.randomUUID();
      await supabase.from("wallet_transactions").insert({
        id: txId,
        wallet_id: wallet.id,
        amount,
        type: "debit",
        category,
        reference_id: referenceId,
        description,
      });

      // 4. Double-Entry ledger write
      await LedgerService.recordDoubleEntry(
        txId,
        { accountId: userId, amount, referenceType: "payout" }, // Debit User
        { accountId: null, amount, referenceType: "payout" } // Credit Platform
      );

      logger.info(`[WalletEngine] Debited ${amount} INR from user ${userId}. New balance: ${newBalance}`);
      return { success: true, newBalance };
    } catch (err) {
      logger.error(`[WalletEngine] Debit operation failure for user ${userId}:`, err as Record<string, unknown>);
      throw err;
    }
  }

  /**
   * Locks wallet funds (moves active balance to locked_balance).
   */
  static async lockFunds(userId: string, amount: number): Promise<boolean> {
    try {
      const supabase = await createServerClient();

      const { data, error: rpcErr } = await supabase.rpc("adjust_wallet_balance", {
        p_user_id: userId,
        p_amount: -amount,
        p_locked_amount: amount,
      });

      if (rpcErr || !data || data.length === 0 || !data[0].success) {
        return false;
      }

      return true;
    } catch (err) {
      logger.error(`[WalletEngine] Lock funds failure for user ${userId}:`, err as Record<string, unknown>);
      return false;
    }
  }

  /**
   * Unlocks wallet funds (moves locked_balance back to active balance).
   */
  static async unlockFunds(userId: string, amount: number): Promise<boolean> {
    try {
      const supabase = await createServerClient();

      const { data, error: rpcErr } = await supabase.rpc("adjust_wallet_balance", {
        p_user_id: userId,
        p_amount: amount,
        p_locked_amount: -amount,
      });

      if (rpcErr || !data || data.length === 0 || !data[0].success) {
        return false;
      }

      return true;
    } catch (err) {
      logger.error(`[WalletEngine] Unlock funds failure for user ${userId}:`, err as Record<string, unknown>);
      return false;
    }
  }
}
