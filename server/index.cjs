const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB (adjust the URI if needed)
mongoose.connect('mongodb://localhost:27017/greenreceip', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const receiptSchema = new mongoose.Schema({}, { strict: false });
const Receipt = mongoose.model('Receipt', receiptSchema);

// POST /api/receipts: Save a receipt to MongoDB
app.post('/api/receipts', async (req, res) => {
  try {
    const data = { ...req.body };
    // Force customerId to be a string
    if (data.customerId) data.customerId = String(data.customerId);
    // Remove/rename _id fields in products to avoid ObjectId casting
    if (Array.isArray(data.products)) {
      data.products = data.products.map(p => {
        const { _id, ...rest } = p;
        return rest;
      });
    }
    // Save all fields as-is, no forced ObjectId
    const receipt = new Receipt(data);
    await receipt.save();
    res.json({ success: true, id: receipt._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save receipt', details: err.message });
  }
});

// (Optional) GET /api/receipts: List all receipts
app.get('/api/receipts', async (req, res) => {
  try {
    const receipts = await Receipt.find().sort({ _id: -1 }).limit(100);
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
