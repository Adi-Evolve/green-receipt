import express from 'express';
import fs from 'fs';
import path from 'path';
import { uploadBackup, downloadBackup, listBackups } from '../utils/drive.js';
const router = express.Router();

// Upload backup to Google Drive
router.post('/upload/:businessId', async (req, res) => {
  // Save incoming backup data to a temp file
  const { data } = req.body; // base64 string
  const fileName = `${req.params.businessId}-backup-${Date.now()}.json`;
  const tempPath = path.join(__dirname, `../uploads/${fileName}`);
  fs.writeFileSync(tempPath, Buffer.from(data, 'base64'));
  const fileId = await uploadBackup({ filePath: tempPath, fileName, mimeType: 'application/json' });
  fs.unlinkSync(tempPath);
  res.json({ fileId });
});

// Download backup from Google Drive
router.get('/download/:fileId', async (req, res) => {
  const tempPath = path.join(__dirname, `../uploads/restore-${req.params.fileId}.json`);
  await downloadBackup({ fileId: req.params.fileId, destPath: tempPath });
  const data = fs.readFileSync(tempPath, 'utf-8');
  fs.unlinkSync(tempPath);
  res.json({ data: Buffer.from(data).toString('base64') });
});

// List backups for a business
router.get('/list/:businessId', async (req, res) => {
  const files = await listBackups({ businessId: req.params.businessId });
  res.json(files);
});

export default router;