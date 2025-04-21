import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const upload = multer({ dest: 'uploads/templates/' });

// Upload template
const router = express.Router();
router.post('/:businessId', upload.single('template'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // Save file path to DB if needed
  res.json({ url: `/uploads/templates/${req.file.filename}`, filename: req.file.originalname });
});

// List templates for business
router.get('/:businessId', (req, res) => {
  const dir = path.join(__dirname, '../uploads/templates/');
  fs.readdir(dir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to list templates' });
    res.json(files.filter(f => f.startsWith(req.params.businessId)));
  });
});

export default router;
