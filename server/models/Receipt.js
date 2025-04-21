import mongoose from 'mongoose';

const ReceiptSchema = new mongoose.Schema({
  businessId: { type: String, required: true },
  receiptNumber: String,
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      price: Number,
      quantity: Number,
      gst: Number,
      amount: Number
    }
  ],
  total: Number,
  date: Date,
  terms: String,
  qrValue: String
});

export default mongoose.model('Receipt', ReceiptSchema);
