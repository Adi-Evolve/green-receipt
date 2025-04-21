import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  businessProfile: {
    businessId: String,
    name: String,
    address: String,
    phone: String,
    email: String,
    logoUrl: String,
    terms: String
  }
});

export default mongoose.model('User', UserSchema);
