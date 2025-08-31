import express from "express";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import Gig from "../models/GIG.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();

// Example: create payment intent/initiate payment (assuming payment provider handled externally)
router.post("/create", authMiddleware, async (req, res) => {
  const { gigId, amount, paymentProviderId } = req.body;
  try {
    // Create a payment record with status pending
    const payment = await Payment.create({
      amount,
      userId: req.user.id,
      gigId,
      paymentProviderId,
      status: "pending",
    });
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: "Failed to create payment" });
  }
});

// Webhook route to receive payment notifications from provider
router.post("/webhook", async (req, res) => {
  try {
    const event = req.body;

    // Validate webhook signature - implementation depends on provider
    // e.g., Stripe: stripe.webhooks.constructEvent(...)

    const paymentProviderId = event.data.object.id; // adapt per provider
    const paymentStatus = event.data.object.status;

    // Fetch payment by provider id
    const payment = await Payment.findOne({ where: { paymentProviderId } });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    if (paymentStatus === "succeeded" && payment.status !== "completed") {
      payment.status = "completed";
      await payment.save();

      // Update user balance or gigs accordingly
      const user = await User.findByPk(payment.userId);
      user.balance = (user.balance || 0) + payment.amount; // example user balance update
      await user.save();

      const gig = await Gig.findByPk(payment.gigId);
      if (gig) {
        // You can update gig status or metrics here as per app logic
      }
    } else if (paymentStatus === "failed") {
      payment.status = "failed";
      await payment.save();
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(400).json({ message: "Webhook error" });
  }
});

export default router;
