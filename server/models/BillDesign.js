import mongoose from 'mongoose';

const BillDesignSchema = new mongoose.Schema({
  businessId: { type: String, required: true, unique: true },
  format: {
    columns: {
      product: Boolean,
      quantity: Boolean,
      gst: Boolean,
      price: Boolean,
      amount: Boolean,
      serial: Boolean,
      discount: Boolean
    },
    elements: {
      logo: Boolean,
      businessInfo: Boolean,
      customerInfo: Boolean,
      termsAndConditions: Boolean,
      warranty: Boolean,
      qrCode: Boolean,
      signature: Boolean,
      notes: Boolean
    },
    font: { type: String, default: 'Arial' },
    color: { type: String, default: '#000000' },
    layout: { type: String, default: 'default' },
    showBorder: { type: Boolean, default: true },
    showGrid: { type: Boolean, default: false },
    preview: { type: Boolean, default: false }
  }
});

export default mongoose.model('BillDesign', BillDesignSchema);
