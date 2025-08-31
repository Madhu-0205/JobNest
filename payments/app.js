// app.js
const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());

const paymentsRoutes = require('./paymentsRoutes');

app.use('/api/payments', paymentsRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
