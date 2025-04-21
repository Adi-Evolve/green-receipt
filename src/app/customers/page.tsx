"use client";

import React, { useEffect, useState, useRef } from 'react';
import ServerNavbar from '../../components/ServerNavbar';
import Footer from '../../components/Footer';
import { supabase } from '../../lib/supabaseClient';
import { addEntity, deleteEntity } from '../../lib/dataSync';
import Toast from '../components/Toast';
import { exportToCSV } from '../components/ExportCSV';
import { syncTable } from '../components/SyncManager';
import { pushUndo, undoLast } from '../components/UndoManager';
import { getUserRole, RoleManager } from '../components/RoleManager';
import { logAudit } from '../components/AuditLog';

export default function CustomersPage() {
  // All hooks must be at the top, before any return
  const [hasMounted, setHasMounted] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<{message: string; type?: 'success'|'error'|'info'}|null>(null);
  const [syncing, setSyncing] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const fileInput = useRef<HTMLInputElement>(null);
  const [userCode, setUserCode] = useState('');
  const [businessId, setBusinessId] = useState('');
  const role = typeof window !== 'undefined' ? getUserRole() : undefined;

  useEffect(() => { setHasMounted(true); }, []);

  useEffect(() => {
    if (!hasMounted) return;
    if (typeof window !== 'undefined' && window.localStorage) {
      setUserCode(localStorage.getItem('user_code') || '');
      setBusinessId(localStorage.getItem('businessId') || '');
    }
  }, [hasMounted]);

  useEffect(() => {
    if (!userCode) return;
    supabase.from('customers').select('*').eq('user_code', userCode).then(({ data }) => {
      if (data) {
        setCustomers(data);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('customers_' + userCode, JSON.stringify(data));
        }
      }
    });
  }, [userCode]);

  if (!hasMounted || typeof window === 'undefined') return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32"></div>
      <span className="ml-4 text-lg">Loading...</span>
    </div>
  );

  function showToast(message: string, type?: 'success'|'error'|'info') {
    setToast({ message, type });
  }

  function handleExport() {
    if (typeof window !== 'undefined' && window.localStorage) {
      exportToCSV(customers, 'customers.csv');
      showToast('Exported to CSV', 'success');
    }
  }

  async function handleSync() {
    if (!userCode) return;
    setSyncing(true);
    try {
      await syncTable('customers', userCode);
      showToast('Sync complete', 'success');
    } catch {
      showToast('Sync failed', 'error');
    }
    setSyncing(false);
  }

  async function addCustomer(newCustomer: any) {
    if (!userCode) return;
    await addEntity('customers', newCustomer, setCustomers);
    logAudit('add', 'customers', newCustomer, userCode);
    showToast('Customer added', 'success');
  }

  async function deleteCustomer(id: string) {
    if (!userCode) return;
    const customer = customers.find(c => c.id === id);
    if (customer) pushUndo('delete', customer, 'customers', userCode);
    await deleteEntity('customers', id, setCustomers);
    logAudit('delete', 'customers', { id }, userCode);
    showToast('Customer deleted', 'info');
  }

  async function handleUndo() {
    await undoLast(supabase);
    showToast('Undo complete', 'success');
    // Reload customers
    if (!userCode) return;
    const { data } = await supabase.from('customers').select('*').eq('user_code', userCode);
    if (data) setCustomers(data);
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!fileInput.current?.files?.[0] || !userCode) return;
    setImporting(true);
    const file = fileInput.current.files[0];
    // CSV import logic (parse and save to Supabase)
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').map(row => row.split(','));
        const headers = rows[0].map(h => h.trim().toLowerCase());
        const importedCustomers = rows.slice(1).filter(row => row.length >= 2).map(row => {
          const customer: any = {};
          headers.forEach((h, i) => customer[h] = row[i]?.trim());
          return customer;
        });
        for (const c of importedCustomers) {
          await addCustomer(c);
        }
        setImporting(false);
        if (typeof window !== 'undefined' && window.localStorage) {
          fileInput.current!.value = '';
        }
        // Refresh customers from Supabase
        const { data } = await supabase.from('customers').select('*').eq('user_code', userCode);
        if (data) setCustomers(data);
        logAudit('import', 'customers', importedCustomers, userCode);
        showToast('Import successful!', 'success');
      } catch (err: any) {
        setImporting(false);
        showToast('Import failed: ' + (err.message || 'Unknown error'), 'error');
      }
    };
    reader.readAsText(file);
  }

  // Pagination, search, filter
  const filtered = customers.filter(c =>
    Object.values(c).some(val => val && val.toString().toLowerCase().includes(search.toLowerCase()))
  );
  const paginated = filtered.slice((page-1)*perPage, page*perPage);
  const totalPages = Math.ceil(filtered.length/perPage);

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <ServerNavbar isLoggedIn={true} />
      <div className="max-w-3xl mx-auto w-full p-4">
        <RoleManager />
        <div className="flex gap-2 mb-2">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="border rounded px-2 py-1" />
          <button onClick={handleExport} className="btn btn-sm btn-green" disabled={role!=='admin'}>Export CSV</button>
          <button onClick={handleSync} className="btn btn-sm btn-blue" disabled={syncing}>Sync</button>
          <button onClick={handleUndo} className="btn btn-sm btn-yellow">Undo</button>
          <input type="file" ref={fileInput} accept=".csv" onChange={handleImport} className="hidden" />
          <button onClick={()=>fileInput.current?.click()} className="btn btn-sm btn-gray" disabled={role!=='admin'}>Import CSV</button>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} />}
        <table className="w-full border mt-2">
          <thead>
            <tr>{Object.keys(customers[0]||{}).map(h=>(<th key={h} className="border px-2 py-1">{h}</th>))}<th>Actions</th></tr>
          </thead>
          <tbody>
            {paginated.map(c => (
              <tr key={c.id}>
                {Object.keys(c).map(k=>(<td key={k} className="border px-2 py-1">{c[k]}</td>))}
                <td>
                  <button onClick={()=>deleteCustomer(c.id)} className="btn btn-xs btn-red" disabled={role!=='admin'}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-2 mt-2 items-center">
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>Next</button>
        </div>
      </div>
      <Footer />
    </main>
  );
}
