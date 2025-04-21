import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  businessId: { type: String, required: true },
  userId: { type: String, required: true },
  type: { type: String, enum: ['offer', 'reminder', 'info'], required: true },
  title: String,
  message: String,
  offerId: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;

