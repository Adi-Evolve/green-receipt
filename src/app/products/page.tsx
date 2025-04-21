"use client";

import React, { useEffect, useState, useRef } from 'react';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabaseClient';
import { addEntity, updateEntity, deleteEntity } from '@/lib/dataSync';
import Toast from '../components/Toast';
import { exportToCSV } from '../components/ExportCSV';
import { syncTable } from '../components/SyncManager';
import { pushUndo, undoLast } from '../components/UndoManager';
import { getUserRole, RoleManager } from '../components/RoleManager';
import { logAudit } from '../components/AuditLog';

export default function ProductsPage() {
  // All hooks must be at the top, before any return
  const [hasMounted, setHasMounted] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
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
    if (typeof window !== 'undefined') {
      setUserCode(localStorage.getItem('user_code') || '');
      setBusinessId(localStorage.getItem('businessId') || '');
    }
  }, [hasMounted]);

  useEffect(() => {
    if (!userCode) return;
    supabase.from('products').select('*').eq('user_code', userCode).then(({ data }) => {
      if (data) {
        setProducts(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('products_' + userCode, JSON.stringify(data));
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
    exportToCSV(products, 'products.csv');
    showToast('Exported to CSV', 'success');
  }

  async function handleSync() {
    if (!userCode) return;
    setSyncing(true);
    try {
      await syncTable('products', userCode);
      showToast('Sync complete', 'success');
    } catch {
      showToast('Sync failed', 'error');
    }
    setSyncing(false);
  }

  async function addProduct(newProduct: any) {
    if (!userCode) return;
    await addEntity('products', newProduct, setProducts);
    logAudit('add', 'products', newProduct, userCode);
    showToast('Product added', 'success');
  }

  async function updateProduct(updatedProduct: any) {
    if (!userCode) return;
    await updateEntity('products', updatedProduct, setProducts);
    logAudit('update', 'products', updatedProduct, userCode);
    showToast('Product updated', 'success');
  }

  async function deleteProduct(id: string) {
    if (!userCode) return;
    const product = products.find(p => p.id === id);
    if (product) pushUndo('delete', product, 'products', userCode);
    await deleteEntity('products', id, setProducts);
    logAudit('delete', 'products', { id }, userCode);
    showToast('Product deleted', 'info');
  }

  async function handleUndo() {
    await undoLast(supabase);
    showToast('Undo complete', 'success');
    // Reload products
    if (!userCode) return;
    const { data } = await supabase.from('products').select('*').eq('user_code', userCode);
    if (data) setProducts(data);
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
        const importedProducts = rows.slice(1).filter(row => row.length >= 2).map(row => {
          const product: any = {};
          headers.forEach((h, i) => product[h] = row[i]?.trim());
          return product;
        });
        for (const prod of importedProducts) {
          await addProduct(prod);
        }
        setImporting(false);
        fileInput.current!.value = '';
        // Refresh products from Supabase
        const { data } = await supabase.from('products').select('*').eq('user_code', userCode);
        if (data) setProducts(data);
        logAudit('import', 'products', importedProducts, userCode);
        showToast('Import successful!', 'success');
      } catch (err: any) {
        setImporting(false);
        showToast('Import failed: ' + (err.message || 'Unknown error'), 'error');
      }
    };
    reader.readAsText(file);
  }

  // Pagination, search, filter
  const filtered = products.filter(p =>
    Object.values(p).some(val => val && val.toString().toLowerCase().includes(search.toLowerCase()))
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
            <tr>{Object.keys(products[0]||{}).map(h=>(<th key={h} className="border px-2 py-1">{h}</th>))}<th>Actions</th></tr>
          </thead>
          <tbody>
            {paginated.map(p => (
              <tr key={p.id}>
                {Object.keys(p).map(k=>(<td key={k} className="border px-2 py-1">{p[k]}</td>))}
                <td>
                  <button onClick={()=>deleteProduct(p.id)} className="btn btn-xs btn-red" disabled={role!=='admin'}>Delete</button>
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
