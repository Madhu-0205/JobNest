"use client";

import { useEffect, useState, useCallback } from "react";
import { QueueItem } from "@/services/realtime-service";

/**
 * Custom React Hook: Offline Queue Synchronizer.
 * - Buffers outgoing mutations (chat messages, tracking) in LocalStorage during disconnections.
 * - Automatically registers window online/offline states to flush queues on connectivity restore.
 * - Integrates offline simulation overrides and exposes logger ticker messages.
 */
export function useOfflineSync(userId: string) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineSim, setOfflineSim] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setSyncLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 40));
  }, []);

  const flushQueue = useCallback(async () => {
    // If physically offline or simulated offline, cancel flush
    if (offlineSim || (typeof navigator !== "undefined" && !navigator.onLine)) {
      addLog("Flush aborted: Client state is currently Offline.");
      return;
    }

    const stored = localStorage.getItem(`offline-queue-${userId}`);
    if (!stored) return;

    try {
      const items: QueueItem[] = JSON.parse(stored);
      if (items.length === 0) return;

      addLog(`Flushing offline synchronization queue (${items.length} items)...`);

      const res = await fetch("/api/realtime/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      });

      const data = await res.json();
      
      if (data.success) {
        addLog(`Synchronized ${data.data.processed} mutations successfully. Failed: ${data.data.failed}.`);
        setQueue([]);
        localStorage.setItem(`offline-queue-${userId}`, JSON.stringify([]));
      } else {
        throw new Error(data.error?.message || "Sync endpoint rejected payload.");
      }
    } catch (err) {
      addLog(`Failed to flush queue. Re-buffering updates. Error: ${err instanceof Error ? err.message : "Network error"}`);
    }
  }, [offlineSim, userId, addLog]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOffline(!navigator.onLine);

    // Load initial queue
    const stored = localStorage.getItem(`offline-queue-${userId}`);
    if (stored) {
      try {
        setQueue(JSON.parse(stored));
      } catch {
        // ignore
      }
    }

    function handleOnline() {
      setIsOffline(false);
      addLog("Network connection restored. Preparing synchronization queue.");
      flushQueue();
    }

    function handleOffline() {
      setIsOffline(true);
      addLog("Network connectivity lost. Switched to Offline Queue Buffer.");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [userId, addLog, flushQueue]);

  const queueEvent = (event: QueueItem) => {
    const nextQueue = [...queue, event];
    setQueue(nextQueue);
    localStorage.setItem(`offline-queue-${userId}`, JSON.stringify(nextQueue));
    addLog(`Queued offline mutation [${event.eventType}]`);
  };

  const toggleSimulateOffline = () => {
    const nextSim = !offlineSim;
    setOfflineSim(nextSim);
    if (nextSim) {
      addLog("SIMULATING CLIENT NETWORK DISCONNECTION.");
    } else {
      addLog("SIMULATION OFFLINE TERMINATED. FLUSHING...");
      // Delay slightly to let network state register
      setTimeout(() => {
        flushQueue();
      }, 300);
    }
  };

  return {
    queue,
    isOffline: isOffline || offlineSim,
    offlineSim,
    syncLogs,
    queueEvent,
    flushQueue,
    toggleSimulateOffline,
  };
}

export default useOfflineSync;
