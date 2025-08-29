require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

const gigsRoutes = require('./routes/gigs');
app.use('/api/gigs', gigsRoutes);

const paymentsRoutes = require('./routes/paymentsRoutes');
app.use('/api/payments', paymentsRoutes);

const searchRoutes = require('./routes/search');
app.use('/api/search', searchRoutes);

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('PostgreSQL connected and models synced.');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('DB connection failed:', err);
  }
})();
