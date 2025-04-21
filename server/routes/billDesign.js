import express from 'express';
import BillDesign from '../models/BillDesign.js';

const router = express.Router();

// Get bill design for a business
router.get('/:businessId', async (req, res) => {
  try {
    const design = await BillDesign.findOne({ businessId: req.params.businessId });
    res.json(design);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save or update bill design for a business
router.post('/', async (req, res) => {
  try {
    const { businessId, format } = req.body;
    const design = await BillDesign.findOneAndUpdate(
      { businessId },
      { format },
      { new: true, upsert: true }
    );
    res.json(design);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
