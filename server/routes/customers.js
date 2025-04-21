import express from 'express';
import Customer from '../models/Customer.js';

const router = express.Router();

// Get all customers for a business
router.get('/:businessId', async (req, res) => {
  try {
    const customers = await Customer.find({ businessId: req.params.businessId });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a customer
router.post('/', async (req, res) => {
  try {
    const { businessId, name, email, phone } = req.body;
    const customer = new Customer({ businessId, name, email, phone });
    await customer.save();
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a customer
router.delete('/:id', async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
