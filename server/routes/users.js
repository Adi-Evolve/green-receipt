import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, businessProfile } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, businessProfile });
    await user.save();
    res.json({ success: true, user: { email, businessProfile } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid password' });
    res.json({ success: true, user: { email: user.email, businessProfile: user.businessProfile } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update business profile (with logo)
router.post('/profile', async (req, res) => {
  try {
    const { email, businessProfile } = req.body;
    const user = await User.findOneAndUpdate(
      { email },
      { businessProfile },
      { new: true }
    );
    res.json({ success: true, user: { email: user.email, businessProfile: user.businessProfile } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
