import React, { useState } from 'react';

export default function BackupRestorePanel({ businessId, getAllData }: { businessId: string, getAllData: () => Promise<any> }) {
  const [status, setStatus] = useState('');
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);

  async function handleBackup() {
    setStatus('Backing up...');
    const data = await getAllData();
    const compressed = btoa(JSON.stringify(data)); // simple base64 for demo
    // Upload to Google Drive via backend
    const res = await fetch(`/api/backup/upload/${businessId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: compressed })
    });
    if (res.ok) {
      setLastBackup(new Date().toLocaleString());
      setStatus('Backup complete!');
      fetchDriveFiles();
    } else {
      setStatus('Backup failed.');
    }
    // Always save to localStorage too
    localStorage.setItem(`backup-${businessId}`, compressed);
  }

  async function handleRestore(fileId?: string) {
    setStatus('Restoring...');
    let compressed = localStorage.getItem(`backup-${businessId}`);
    if (fileId) {
      // Download from Drive via backend
      const res = await fetch(`/api/backup/download/${fileId}`);
      if (res.ok) {
        const { data } = await res.json();
        compressed = data;
      }
    }
    if (!compressed) {
      setStatus('No backup found.');
      return;
    }
    const data = JSON.parse(atob(compressed));
    Object.keys(data).forEach(key => localStorage.setItem(key, JSON.stringify(data[key])));
    setStatus('Restore complete! Please reload the app.');
  }

  async function fetchDriveFiles() {
    const res = await fetch(`/api/backup/list/${businessId}`);
    if (res.ok) {
      const files = await res.json();
      setDriveFiles(files);
    }
  }

  React.useEffect(() => { fetchDriveFiles(); }, [businessId]);

  return (
    <div className="bg-white rounded shadow p-4 mb-6">
      <div className="font-bold mb-2">Backup & Restore</div>
      <div className="flex gap-4 mb-2">
        <button className="btn-secondary" onClick={handleBackup}>Backup to Drive & Local</button>
        <button className="btn-secondary" onClick={() => handleRestore()}>Restore from Local</button>
      </div>
      <div className="mb-2">
        <div className="font-semibold text-xs mb-1">Google Drive Backups:</div>
        {driveFiles.length === 0 && <div className="text-xs text-gray-400">No Drive backups found.</div>}
        {driveFiles.map(f => (
          <div key={f.id} className="flex items-center gap-2 text-xs">
            <span>{f.name} ({new Date(f.createdTime).toLocaleString()})</span>
            <button className="btn-xs btn-primary" onClick={() => handleRestore(f.id)}>Restore</button>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-500">Last backup: {lastBackup || 'Never'}</div>
      <div className="text-xs text-blue-600 mt-1">{status}</div>
    </div>
  );
}
