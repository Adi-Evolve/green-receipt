import express from 'express';
import BusinessProfile from '../models/BusinessProfile.js';

const router = express.Router();

// Get profile by businessId
router.get('/:businessId', async (req, res) => {
  try {
    const profile = await BusinessProfile.findOne({ businessId: req.params.businessId });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or update profile
router.post('/', async (req, res) => {
  try {
    const { businessId, name, address, phone, email, logoUrl, terms } = req.body;
    let profile = await BusinessProfile.findOneAndUpdate(
      { businessId },
      { name, address, phone, email, logoUrl, terms },
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
