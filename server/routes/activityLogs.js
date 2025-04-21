import express from 'express';
import ActivityLog from '../models/ActivityLog.js';
const router = express.Router();

// List logs
router.get('/:businessId', async (req, res) => {
  const logs = await ActivityLog.find({ businessId: req.params.businessId }).sort({ createdAt: -1 });
  res.json(logs);
});
// Create log
router.post('/', async (req, res) => {
  const log = await ActivityLog.create(req.body);
  res.json(log);
});
// At the end of server/routes/activityLogs.js
export default router;
