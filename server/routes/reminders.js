import express from 'express';
import Reminder from '../models/Reminder.js';
const router = express.Router();

// List reminders
router.get('/:businessId', async (req, res) => {
  const reminders = await Reminder.find({ businessId: req.params.businessId });
  res.json(reminders);
});
// Create reminder
router.post('/', async (req, res) => {
  const r = await Reminder.create(req.body);
  res.json(r);
});
// Update reminder
router.patch('/:id', async (req, res) => {
  const r = await Reminder.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(r);
});
// Delete reminder
router.delete('/:id', async (req, res) => {
  await Reminder.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
export default router;
