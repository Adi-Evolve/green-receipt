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
    const receipt = new Receipt(req.body);
    await receipt.save();
    res.json({ success: true, id: receipt._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save receipt' });
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

app.listen(5500, () => {
  console.log('Server running on http://localhost:5500');
});
