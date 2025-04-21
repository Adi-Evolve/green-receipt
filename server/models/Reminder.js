import mongoose from 'mongoose';

const ReminderSchema = new mongoose.Schema({
  businessId: { type: String, required: true },
  userId: String,
  type: { type: String, enum: ['invoice', 'offer', 'appointment'], required: true },
  targetId: String,
  message: String,
  date: Date,
  sent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Reminder = mongoose.model('Reminder', ReminderSchema);
export default Reminder;
