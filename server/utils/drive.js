// Google Drive integration using service account
import { google } from 'googleapis';
import fs from 'fs';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const KEYFILEPATH = 'studxchange-pdf-drive-5346d7ac378f.json';

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

// Upload a file to Google Drive
export async function uploadBackup({ filePath, fileName, mimeType }) {
  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType,
    },
    media: {
      mimeType,
      body: fs.createReadStream(filePath),
    },
    fields: 'id',
  });
  return res.data.id;
}

// Download a file from Google Drive by fileId
export async function downloadBackup({ fileId, destPath }) {
  const res = await drive.files.get({
    fileId,
    alt: 'media',
  }, { responseType: 'stream' });
  return new Promise((resolve, reject) => {
    const dest = fs.createWriteStream(destPath);
    res.data.pipe(dest);
    dest.on('finish', resolve);
    dest.on('error', reject);
  });
}

// List backup files for a business
export async function listBackups({ businessId }) {
  const res = await drive.files.list({
    q: `name contains '${businessId}-backup'`,
    fields: 'files(id, name, createdTime)',
    orderBy: 'createdTime desc',
  });
  return res.data.files;
}
