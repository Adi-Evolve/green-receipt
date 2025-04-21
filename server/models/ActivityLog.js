import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  businessId: { type: String, required: true },
  staffId: String,
  action: String,
  details: String,
  createdAt: { type: Date, default: Date.now }
});

const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
export default ActivityLog;
