import express from 'express';
import Receipt from '../models/Receipt.js';

const router = express.Router();

// Get all receipts for a business
router.get('/:businessId', async (req, res) => {
  try {
    const receipts = await Receipt.find({ businessId: req.params.businessId }).populate('customerId').populate('products.productId');
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a receipt
router.post('/', async (req, res) => {
  try {
    const receipt = new Receipt(req.body);
    await receipt.save();
    res.json(receipt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
