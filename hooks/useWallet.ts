"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { logger } from "@/services/logger";
import { useAuth } from "@/providers/AuthProvider";

export interface WalletTransaction {
  id: string;
  amount: number;
  type: "credit" | "debit";
  category: string;
  reference_id: string;
  description: string | null;
  created_at: string;
}

export function useWallet() {
  const authContext = useAuth();
  const userId = authContext?.user?.id;

  const [balance, setBalance] = useState<number | null>(null);
  const [pendingBalance, setPendingBalance] = useState<number | null>(null);
  const [lockedBalance, setLockedBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchWallet = useCallback(async () => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/financial/wallet", {
        signal: controller.signal,
      });

      // 1. Detect HTTP 401 unauthenticated response
      if (res.status === 401) {
        setBalance(null);
        setPendingBalance(null);
        setLockedBalance(null);
        setTransactions([]);
        setIsUnauthorized(true);
        setError(null);
        return;
      }

      let data: {
        success?: boolean;
        error?: { code?: string; message?: string };
        data?: {
          balance?: number;
          pendingBalance?: number;
          lockedBalance?: number;
          transactions?: WalletTransaction[];
        };
      } | null = null;
      try {
        data = await res.json();
      } catch {
        // Fall through to error handler if response isn't JSON
      }

      if (data?.error?.code === "UNAUTHORIZED") {
        setBalance(null);
        setPendingBalance(null);
        setLockedBalance(null);
        setTransactions([]);
        setIsUnauthorized(true);
        setError(null);
        return;
      }

      // 2. Successful response (200)
      if (res.ok && data?.success && data.data) {
        setBalance(data.data.balance !== undefined && data.data.balance !== null ? Number(data.data.balance) : 0);
        setPendingBalance(data.data.pendingBalance !== undefined && data.data.pendingBalance !== null ? Number(data.data.pendingBalance) : 0);
        setLockedBalance(data.data.lockedBalance !== undefined && data.data.lockedBalance !== null ? Number(data.data.lockedBalance) : 0);
        setTransactions(data.data.transactions || []);
        setIsUnauthorized(false);
        setError(null);
      } else {
        // 3. Genuine 500 / server / database failures
        const message = data?.error?.message || `Failed to load wallet data (${res.status}).`;
        throw new Error(message);
      }
    } catch (err) {
      // Treat AbortError as an expected cancellation, not a failure
      if (err instanceof Error && err.name === "AbortError") {
        logger.debug("[useWallet] Request aborted.");
        return;
      }

      const errorObj = err instanceof Error ? err : new Error(String(err));
      logger.error("[useWallet] Failed to fetch wallet data.", errorObj);
      setBalance(null);
      setPendingBalance(null);
      setLockedBalance(null);
      setTransactions([]);
      setIsUnauthorized(false);
      setError(errorObj);
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchWallet();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchWallet, userId]);

  const depositFunds = async (amount: number, gateway: "razorpay" | "stripe" = "razorpay") => {
    try {
      const idempotencyKey = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      // 1. Create gateway payment order
      const res = await fetch("/api/financial/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, gateway, idempotencyKey }),
      });
      const data = await res.json();

      if (data.success) {
        await fetchWallet();
        return { success: true, orderId: data.data.orderId };
      }
      return { success: false, error: "Payment checkout failed." };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment checkout failed.";
      return { success: false, error: message };
    }
  };

  return {
    balance,
    pendingBalance,
    lockedBalance,
    transactions,
    loading,
    error,
    isUnauthorized,
    depositFunds,
    refresh: fetchWallet,
  };
}

export default useWallet;
