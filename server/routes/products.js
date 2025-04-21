import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// Get all products for a business
router.get('/:businessId', async (req, res) => {
  try {
    const products = await Product.find({ businessId: req.params.businessId });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a product
router.post('/', async (req, res) => {
  try {
    const { businessId, name, price, gst } = req.body;
    const product = new Product({ businessId, name, price, gst });
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a product
router.delete('/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
