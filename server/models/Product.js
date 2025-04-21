import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  businessId: { type: String, required: true },
  name: String,
  description: String,
  image: String,
  sku: String,
  price: Number,
  gst: Number,
  stock: Number,
  lowStockThreshold: { type: Number, default: 5 },
  category: String
});

export default mongoose.model('Product', ProductSchema);
