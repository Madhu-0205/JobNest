// paymentsService.js
const Razorpay = require('razorpay');
const Stripe = require('stripe');
const QRCode = require('qrcode');
const pool = require('./db');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

async function savePayment(provider, userId, amount, status, transactionId) {
  const query = `INSERT INTO payments (provider, user_id, amount, status, transaction_id, created_at) 
                 VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`;
  const values = [provider, userId, amount, status, transactionId];
  const res = await pool.query(query, values);
  return res.rows[0];
}

async function createRazorpayPayment(userId, amount) {
  const options = {
    amount: amount * 100, // amount in paise
    currency: "INR",
    payment_capture: '1',
  };
  const order = await razorpay.orders.create(options);
  const qrData = `upi://pay?pa=${process.env.UPI_ID}&pn=YourCompany&am=${(amount).toFixed(2)}&cu=INR&tn=Payment+via+Razorpay`;
  const qrCode = await QRCode.toDataURL(qrData);
  await savePayment('razorpay', userId, amount, 'created', order.id);
  return { order, qrCode };
}

async function createStripePayment(userId, amount) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'inr',
    metadata: { userId: userId.toString() },
  });
  await savePayment('stripe', userId, amount, 'created', paymentIntent.id);
  return paymentIntent;
}

async function generateUpiQrCode(amount) {
  const upiString = `upi://pay?pa=${process.env.UPI_ID}&pn=YourCompany&am=${amount.toFixed(2)}&cu=INR&tn=UPI+Payment`;
  const qrCode = await QRCode.toDataURL(upiString);
  return qrCode;
}

module.exports = {
  createRazorpayPayment,
  createStripePayment,
  generateUpiQrCode,
};
