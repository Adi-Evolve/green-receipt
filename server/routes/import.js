import express from 'express';
import multer from 'multer';
import csv from 'csvtojson';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';

const upload = multer({ dest: 'uploads/imports/' });
const router = express.Router();

// Import products from CSV/Excel (Tally or standard)
router.post('/products/:businessId', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const rows = await csv().fromFile(req.file.path);
  const mapped = rows.map(row => ({
    businessId: req.params.businessId,
    name: row.Name || row.name,
    sku: row.SKU || row.sku,
    price: Number(row.Price || row.price),
    stock: Number(row.Stock || row.stock),
    description: row.Description || row.description,
    category: row.Category || row.category
  }));
  const result = await Product.insertMany(mapped, { ordered: false }).catch(e => e.insertedDocs || []);
  res.json({ imported: result.length });
});

// Import customers from CSV/Excel (Tally or standard)
router.post('/customers/:businessId', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const rows = await csv().fromFile(req.file.path);
  const mapped = rows.map(row => ({
    businessId: req.params.businessId,
    name: row.Name || row.name,
    email: row.Email || row.email,
    phone: row.Phone || row.phone
  }));
  const result = await Customer.insertMany(mapped, { ordered: false }).catch(e => e.insertedDocs || []);
  res.json({ imported: result.length });
});

export default router;
