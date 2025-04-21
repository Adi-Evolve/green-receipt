import express from 'express';
import mongoose from 'mongoose';
import Staff from '../models/Staff.js';
const router = express.Router();


const StaffSchema = new mongoose.Schema({
  businessId: {
    type: String,
    required: true
  },
  name: String,
  email: String,
  role: String
  // Add other fields as needed
});

// List staff
router.get('/:businessId', async (req, res) => {
  const staff = await Staff.find({ businessId: req.params.businessId });
  res.json(staff);
});
// Create staff
router.post('/', async (req, res) => {
  const s = await Staff.create(req.body);
  res.json(s);
});
// Update staff
router.patch('/:id', async (req, res) => {
  const s = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(s);
});
// Delete staff
router.delete('/:id', async (req, res) => {
  await Staff.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
export default router;