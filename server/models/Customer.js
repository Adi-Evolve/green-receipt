import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  businessId: { type: String, required: true },
  name: String,
  email: String,
  phone: String,
  tags: [String],
  notes: String,
  purchaseHistory: [
    {
      receiptId: String,
      date: Date,
      amount: Number
    }
  ],
  communication: [
    {
      date: Date,
      type: String,
      message: String
    }
  ]
});

export default mongoose.model('Customer', CustomerSchema);
