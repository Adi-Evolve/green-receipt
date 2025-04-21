import express from 'express';
import Expense from '../models/Expense.js';
const router = express.Router();

// List expenses
router.get('/:businessId', async (req, res) => {
  const expenses = await Expense.find({ businessId: req.params.businessId });
  res.json(expenses);
});
// Create expense
router.post('/', async (req, res) => {
  const e = await Expense.create(req.body);
  res.json(e);
});
// Update expense
router.patch('/:id', async (req, res) => {
  const e = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(e);
});
// Delete expense
router.delete('/:id', async (req, res) => {
  await Expense.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
export default router;
