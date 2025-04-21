import express from 'express';
import Notification from '../models/Notification.js ';
const router = express.Router();

// Get notifications for a user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
  res.json(notifications);
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ success: true });
});

// Create notification (used by offers logic)
router.post('/', async (req, res) => {
  const notif = await Notification.create(req.body);
  res.json(notif);
});

export default router;
