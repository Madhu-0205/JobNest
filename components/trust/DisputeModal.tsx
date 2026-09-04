"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { useToast } from "@/hooks/useToast";

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  respondentId: string;
  opportunityId: string;
  onSuccess?: () => void;
}

export function DisputeModal({ isOpen, onClose, respondentId, opportunityId, onSuccess }: DisputeModalProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/trust/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respondentId,
          opportunityId,
          reason,
          description,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toastSuccess("Dispute opened successfully.", "Our mediation team will review your claim under SLA protocols.");
        onSuccess?.();
        onClose();
      } else {
        const msg = data.error?.message || "Unable to submit dispute. Please check your inputs and try again.";
        setError(msg);
        toastError(msg);
      }
    } catch {
      const msg = "A network error occurred. Please check your connection and try again.";
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-rose-500 text-xl font-bold">Open a Dispute</DialogTitle>
          <DialogDescription>
            Report an issue with this interaction. Disputes are reviewed by moderators and do not automatically impact trust scores until resolved.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Typography variant="muted" className="font-semibold">Reason</Typography>
            <select
              className="w-full bg-muted border border-border rounded-md p-2.5 text-sm outline-none"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="" disabled>Select a reason...</option>
              <option value="non_payment">Non-Payment</option>
              <option value="incomplete_work">Incomplete Work</option>
              <option value="poor_quality">Poor Quality</option>
              <option value="unresponsive">Unresponsive</option>
              <option value="harassment">Harassment / Safety</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Typography variant="muted" className="font-semibold">Description</Typography>
            <textarea
              className="w-full bg-muted border border-border rounded-md p-3 text-sm min-h-30 focus:outline-none focus:ring-1 focus:ring-rose-500"
              placeholder="Provide details about the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && <Typography variant="muted" className="text-rose-500">{error}</Typography>}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !reason || description.trim() === ""} className="bg-rose-600 hover:bg-rose-700 text-white">
            {loading ? "Submitting..." : "Submit Dispute"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
