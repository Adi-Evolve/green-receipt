import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  businessId: { type: String, required: true },
  customerId: String,
  items: [
    {
      productId: String,
      name: String,
      quantity: Number,
      price: Number,
      gst: Number
    }
  ],
  total: Number,
  status: { type: String, enum: ['draft', 'sent', 'paid', 'overdue'], default: 'draft' },
  dueDate: Date,
  paymentLink: String,
  createdAt: { type: Date, default: Date.now }
});

const Invoice = mongoose.model('Invoice', InvoiceSchema);
export default Invoice;
