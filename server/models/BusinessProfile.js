import mongoose from 'mongoose';

const BusinessProfileSchema = new mongoose.Schema({
  businessId: { type: String, required: true, unique: true },
  name: String,
  address: String,
  phone: String,
  email: String,
  logoUrl: String,
  terms: String
});

export default mongoose.model('BusinessProfile', BusinessProfileSchema);
