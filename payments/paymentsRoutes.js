// paymentsRoutes.js
const express = require('express');
const router = express.Router();
const { createRazorpayPayment, createStripePayment, generateUpiQrCode } = require('./paymentsService');

router.post('/razorpay', async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || !amount) return res.status(400).json({ error: 'Missing parameters' });
    const paymentData = await createRazorpayPayment(userId, amount);
    res.json(paymentData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/stripe', async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || !amount) return res.status(400).json({ error: 'Missing parameters' });
    const paymentIntent = await createStripePayment(userId, amount);
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/upi-qrcode', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ error: 'Amount is required' });
    const qrCode = await generateUpiQrCode(amount);
    res.json({ qrCode });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
