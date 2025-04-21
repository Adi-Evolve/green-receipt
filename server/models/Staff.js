import mongoose from 'mongoose';

const StaffSchema = new mongoose.Schema({
  businessId: { type: String, required: true },
  name: String,
  email: String,
  role: { type: String, enum: ['admin', 'sales', 'viewer'], default: 'viewer' },
  invitedAt: Date,
  joinedAt: Date,
  status: { type: String, enum: ['invited', 'active', 'inactive'], default: 'invited' }
});

const Staff = mongoose.model('Staff', StaffSchema);
export default Staff;
