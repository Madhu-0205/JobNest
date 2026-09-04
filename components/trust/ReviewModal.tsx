"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { useToast } from "@/hooks/useToast";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  revieweeId: string;
  opportunityId?: string;
  ratingType: "local" | "pro";
  onSuccess?: () => void;
}

export function ReviewModal({ isOpen, onClose, revieweeId, opportunityId, ratingType, onSuccess }: ReviewModalProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/trust/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revieweeId,
          opportunityId,
          ratingType,
          score,
          categoryScores: {},
          reviewText,
          attachments: []
        }),
      });

      const data = await res.json();
      if (data.success) {
        toastSuccess("Review submitted successfully.", "Your feedback has been recorded on the trust ledger.");
        onSuccess?.();
        onClose();
      } else {
        const msg = data.error?.message || "Unable to submit review. Please try again.";
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
          <DialogTitle className="gold-gradient-text text-xl">Leave a Review</DialogTitle>
          <DialogDescription>
            Share your experience to help the JobNest community.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Typography variant="muted" className="font-semibold">Rating</Typography>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setScore(s)}
                  className={`text-2xl transition-colors ${s <= score ? 'text-amber-500' : 'text-muted'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Typography variant="muted" className="font-semibold">Your Review</Typography>
            <textarea
              className="w-full bg-muted border border-border rounded-md p-3 text-sm min-h-30 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="Describe what it was like working with them..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </div>

          {error && <Typography variant="muted" className="text-rose-500">{error}</Typography>}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || reviewText.trim() === ""} className="bg-amber-600 hover:bg-amber-700 text-white">
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
