"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode.react';
import ServerNavbar from '../../../components/ServerNavbar';
import Footer from '../../../components/Footer';
import Toast from '../../components/Toast';
import { exportToCSV } from '../../components/ExportCSV';
import { syncTable } from '../../components/SyncManager';
import { pushUndo, undoLast } from '../../components/UndoManager';
import { getUserRole, RoleManager } from '../../components/RoleManager';
import { logAudit } from '../../components/AuditLog';
import { supabase } from '@/lib/supabaseClient';
import { addEntity, updateEntity, deleteEntity } from '@/lib/dataSync';

export default function PublicReceiptPage() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState<any>(null);
  const [toast, setToast] = useState<{message: string; type?: 'success'|'error'|'info'}|null>(null);
  const [syncing, setSyncing] = useState(false);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const businessId = typeof window !== 'undefined' ? localStorage.getItem('businessId') || '' : '';
  const role = getUserRole();

  // Load receipts from localStorage first, then Supabase if not found
  useEffect(() => {
    let localReceipt: any = null;
    if (businessId) {
      const local = localStorage.getItem('receipts_' + businessId);
      if (local) {
        const localReceipts = JSON.parse(local);
        localReceipt = localReceipts.find((r: any) => r.id === id);
        setReceipt(localReceipt);
      }
    }
    // Always fetch from Supabase and update localStorage for sync
    if (businessId) {
      supabase.from('receipts').select('*').eq('business_id', businessId).then(({ data }) => {
        if (data) {
          const receiptData = data.find((r: any) => r.id === id);
          setReceipt(receiptData);
          localStorage.setItem('receipts_' + businessId, JSON.stringify(data));
        }
      });
    }
  }, [id, businessId]);

  // Load all receipts for export/search/pagination
  useEffect(() => {
    if (businessId) {
      supabase.from('receipts').select('*').eq('business_id', businessId).then(({ data }) => {
        if (data) setReceipts(data);
      });
    }
  }, [businessId]);

  async function addReceipt(newReceipt: any) {
    await addEntity('receipts', newReceipt, setReceipts);
  }

  async function updateReceipt(updatedReceipt: any) {
    await updateEntity('receipts', updatedReceipt, setReceipts);
  }

  async function deleteReceipt(id: string) {
    await deleteEntity('receipts', id, setReceipts);
  }

  function showToast(message: string, type?: 'success'|'error'|'info') {
    setToast({ message, type });
  }

  function handleExport() {
    exportToCSV(receipts, 'receipts.csv');
    showToast('Exported to CSV', 'success');
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await syncTable('receipts', businessId);
      showToast('Sync complete', 'success');
    } catch {
      showToast('Sync failed', 'error');
    }
    setSyncing(false);
  }

  async function handleUndo() {
    await undoLast(supabase);
    showToast('Undo complete', 'success');
    // Reload receipts
    const { data } = await supabase.from('receipts').select('*').eq('business_id', businessId);
    if (data) setReceipts(data);
  }

  // Pagination, search, filter
  const filtered = receipts.filter(r =>
    Object.values(r).some(val => val && val.toString().toLowerCase().includes(search.toLowerCase()))
  );
  const paginated = filtered.slice((page-1)*perPage, page*perPage);
  const totalPages = Math.ceil(filtered.length/perPage);

  if (!receipt) return <div className="p-8">Loading...</div>;

  return (
    <div>
      <ServerNavbar isLoggedIn={false} />
      <main className="max-w-2xl mx-auto py-10 px-4">
        <RoleManager />
        <div className="flex gap-2 mb-2">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="border rounded px-2 py-1" />
          <button onClick={handleExport} className="btn btn-sm btn-green" disabled={role!=='admin'}>Export CSV</button>
          <button onClick={handleSync} className="btn btn-sm btn-blue" disabled={syncing}>Sync</button>
          <button onClick={handleUndo} className="btn btn-sm btn-yellow">Undo</button>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} />}
        <h1 className="text-2xl font-bold mb-6">Receipt #{receipt.code}</h1>
        <div className="bg-white rounded shadow p-6 mb-4">
          <div className="mb-2 font-semibold">Customer: {receipt.customerName}</div>
          <div className="mb-2">Date: {new Date(receipt.date).toLocaleDateString()}</div>
          <div className="mb-2">Amount: ₹{receipt.amount}</div>
          <div className="mb-2">Business: {receipt.businessName}</div>
          {/* Add more receipt details as needed */}
        </div>
        {/* Receipts Table for admin/staff */}
        {role === 'admin' && (
          <table className="w-full border mt-2">
            <thead>
              <tr>{Object.keys(receipts[0]||{}).map(h=>(<th key={h} className="border px-2 py-1">{h}</th>))}</tr>
            </thead>
            <tbody>
              {paginated.map(r => (
                <tr key={r.id}>
                  {Object.keys(r).map(k=>(<td key={k} className="border px-2 py-1">{r[k]}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {role === 'admin' && (
          <div className="flex gap-2 mt-2 items-center">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Prev</button>
            <span>Page {page} of {totalPages}</span>
            <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>Next</button>
          </div>
        )}
        <div className="mt-8">
          <QRCode value={typeof window !== 'undefined' ? window.location.href : ''} size={128} />
          <div className="text-xs mt-2 text-gray-500">Scan to view this receipt online</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
