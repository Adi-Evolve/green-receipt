require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Profile Schema
const profileSchema = new mongoose.Schema({
  email: { type: String, required: true },
  businessProfile: {
    businessId: String,
    name: String,
    address: String,
    gst: String,
    phone: String,
    email: String,
    logoUrl: String,
    terms: String,
  },
}, { timestamps: true });

const Profile = mongoose.model('Profile', profileSchema);

// Bill Design Schema (updated for multiple per business)
const billDesignSchema = new mongoose.Schema({
  businessId: { type: String, required: true },
  name: { type: String, required: true }, // e.g., 'Format 1', 'Invoice A'
  designData: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now }
});
billDesignSchema.index({ businessId: 1, name: 1 }, { unique: true }); // unique per business
const BillDesign = mongoose.model('BillDesign', billDesignSchema);

// Receipt Schema
const receiptSchema = new mongoose.Schema({
  businessId: { type: String, required: true },
  receiptNumber: { type: String, required: true },
  customerId: { type: String },
  products: { type: Array, required: true },
  total: { type: Number, required: true },
  date: { type: String, required: true },
  terms: { type: String },
  qrValue: { type: String },
}, { timestamps: true });
const Receipt = mongoose.model('Receipt', receiptSchema);

// Customers Schema
const customerSchema = new mongoose.Schema({
  businessId: { type: String, required: true },
  name: String,
  email: String,
  phone: String
}, { timestamps: true });
const Customer = mongoose.model('Customer', customerSchema);

// Products Schema
const productSchema = new mongoose.Schema({
  businessId: { type: String, required: true },
  name: String,
  sku: String,
  price: Number,
  stock: Number,
  gst: Number,
  description: String
}, { timestamps: true });
const Product = mongoose.model('Product', productSchema);

// Register/Update Profile Endpoint
app.post('/api/users/register', async (req, res) => {
  try {
    const { email, businessProfile } = req.body;
    if (!email || !businessProfile) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Upsert profile by email
    const profile = await Profile.findOneAndUpdate(
      { email },
      { email, businessProfile },
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save a new bill design (or update by name)
app.post('/api/bill-design', async (req, res) => {
  try {
    const { businessId, name, designData } = req.body;
    if (!businessId || !name || !designData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const billDesign = await BillDesign.findOneAndUpdate(
      { businessId, name },
      { designData, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    res.json(billDesign);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A design with this name already exists.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Fetch all bill designs for a business
app.get('/api/bill-design/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const billDesigns = await BillDesign.find({ businessId });
    res.json(billDesigns);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Rename a bill design
app.put('/api/bill-design/:id/rename', async (req, res) => {
  try {
    const { id } = req.params;
    const { newName } = req.body;
    if (!newName) return res.status(400).json({ error: 'Missing newName' });
    const existing = await BillDesign.findOne({ _id: { $ne: id }, name: newName });
    if (existing) return res.status(409).json({ error: 'A design with this name already exists.' });
    const updated = await BillDesign.findByIdAndUpdate(id, { name: newName }, { new: true });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save a receipt
app.post('/api/receipts', async (req, res) => {
  try {
    const { businessId, receiptNumber, customerId, products, total, date, terms, qrValue } = req.body;
    if (!businessId || !receiptNumber || !products || !total || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const receipt = new Receipt({ businessId, receiptNumber, customerId, products, total, date, terms, qrValue });
    await receipt.save();
    res.json(receipt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Fetch receipts by businessId
app.get('/api/receipts/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const receipts = await Receipt.find({ businessId });
    res.json(receipts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get customers by businessId
app.get('/api/customers/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const customers = await Customer.find({ businessId });
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get products by businessId
app.get('/api/products/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const products = await Product.find({ businessId });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
