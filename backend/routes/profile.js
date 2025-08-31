const express = require('express');
const authMiddleware = require('../middleware/authmiddleware');
const User = require('../models/User');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, { attributes: { exclude: ['passwordHash'] } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
