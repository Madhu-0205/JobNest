const express = require('express');
const crypto = require('crypto');
const paymentsService = require('../paymentsService');

const router = express.Router();

// Verify webhook signature middleware
function verifySignature(req, res, next) {
  const secret = process.env.PAYMENTS_WEBHOOK_SECRET; // Set in .env
  const signature = req.headers['x-payments-signature'];
  const payload = JSON.stringify(req.body);

  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (hash !== signature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
}

// Example webhook endpoint
router.post('/webhook', verifySignature, (req, res) => {
  try {
    const event = req.body;

    // Process event type
    switch (event.type) {
      case 'payment.succeeded':
        paymentsService.handlePaymentSuccess(event.data);
        break;
      case 'payment.failed':
        paymentsService.handlePaymentFailure(event.data);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    res.status(500).json({ error: 'Webhook handling error' });
  }
});

module.exports = router;
