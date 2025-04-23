"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Papa from 'papaparse';

export default function ProductInventoryDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', price: '', stock: '', sku: '', gst: '' });
  const [alert, setAlert] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      let businessId = typeof window !== 'undefined' ? localStorage.getItem('businessId') : '';
      let localProducts: any[] = [];
      if (businessId) {
        try {
          localProducts = JSON.parse(localStorage.getItem(`products_${businessId}`) || '[]');
        } catch {}
      }
      let { data: supaProducts, error: supaError } = await supabase.from('products').select('*').eq('businessId', businessId);
      if (supaError) supaProducts = [];
      setProducts([...(localProducts || []), ...(supaProducts || [])]);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  async function saveProductToStorageAndDB(product: any, isEdit: boolean) {
    const businessId = typeof window !== 'undefined' ? localStorage.getItem('businessId') : '';
    let products: any[] = [];
    if (businessId) {
      try {
        products = JSON.parse(localStorage.getItem(`products_${businessId}`) || '[]');
      } catch {}
    }
    let updated;
    if (isEdit) {
      updated = products.map(p => (p.sku === product.sku ? product : p));
    } else {
      updated = [...products, product];
    }
    localStorage.setItem(`products_${businessId}`, JSON.stringify(updated));
    // Sync to Supabase
    if (isEdit) {
      await supabase.from('products').update(product).eq('sku', product.sku).eq('businessId', businessId);
    } else {
      await supabase.from('products').insert([{ ...product, businessId }]);
    }
    setProducts(updated);
  }

  async function deleteProduct(product: any) {
    const businessId = typeof window !== 'undefined' ? localStorage.getItem('businessId') : '';
    let products: any[] = [];
    if (businessId) {
      try {
        products = JSON.parse(localStorage.getItem(`products_${businessId}`) || '[]');
      } catch {}
    }
    const updated = products.filter(p => p.sku !== product.sku);
    localStorage.setItem(`products_${businessId}`, JSON.stringify(updated));
    await supabase.from('products').delete().eq('sku', product.sku).eq('businessId', businessId);
    setProducts(updated);
  }

  function handleEdit(product: any) {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      price: product.price || '',
      stock: product.stock || '',
      sku: product.sku || '',
      gst: product.gst || ''
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleCancel() {
    setEditingProduct(null);
    setForm({ name: '', price: '', stock: '', sku: '', gst: '' });
  }

  async function handleSave() {
    const product = { ...form, price: Number(form.price), stock: Number(form.stock), gst: Number(form.gst) };
    await saveProductToStorageAndDB(product, !!editingProduct.name);
    setEditingProduct(null);
    setForm({ name: '', price: '', stock: '', sku: '', gst: '' });
  }

  async function handleDelete(product: any) {
    if (window.confirm(`Delete product ${product.name}?`)) {
      await deleteProduct(product);
    }
  }

  // In-app low stock alert
  useEffect(() => {
    const lowStock = products.filter(p => p.stock !== undefined && p.stock <= 5);
    if (lowStock.length > 0) {
      setAlert(`Low stock alert: ${lowStock.map(p => p.name).join(', ')}`);
    } else {
      setAlert(null);
    }
  }, [products]);

  // Bulk CSV import
  function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: async (results: any) => {
        const imported = results.data.map((row: any) => ({
          ...row,
          price: Number(row.price),
          stock: Number(row.stock),
          gst: Number(row.gst),
        }));
        for (const prod of imported) {
          await saveProductToStorageAndDB(prod, false);
        }
      }
    });
  }

  // Bulk CSV export
  function handleExportCSV() {
    const csv = Papa.unparse(products);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-6">Product Inventory</h2>
      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search products..."
          className="border px-3 py-2 rounded"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2 items-center">
          <button className="btn-secondary" onClick={handleExportCSV}>Export CSV</button>
          <label className="btn-secondary cursor-pointer">
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          </label>
          <button
            className="btn-primary"
            onClick={() => handleEdit({})}
          >Add Product</button>
        </div>
      </div>
      {alert && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded shadow">{alert}</div>
      )}
      {loading ? <div>Loading...</div> : error ? <div className="text-red-600">{error}</div> : (
        <table className="w-full text-sm mb-4">
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Stock</th>
              <th>GST</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p, i) => (
              <tr key={i} className={p.stock !== undefined && p.stock <= 5 ? 'bg-red-50' : ''}>
                <td>{p.name}</td>
                <td>{p.sku}</td>
                <td>₹{p.price}</td>
                <td>{p.stock !== undefined ? p.stock : '-'}</td>
                <td>{p.gst ? p.gst + '%' : '-'}</td>
                <td>
                  <button className="btn-secondary mr-2" onClick={() => handleEdit(p)}>Edit</button>
                  <button className="btn-danger" onClick={() => handleDelete(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Edit/Add Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-red-500" onClick={handleCancel}>✕</button>
            <h2 className="text-xl font-bold mb-4">{editingProduct.name ? 'Edit Product' : 'Add Product'}</h2>
            <div className="space-y-3">
              <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="border px-3 py-2 rounded w-full" />
              <input name="sku" value={form.sku} onChange={handleChange} placeholder="SKU" className="border px-3 py-2 rounded w-full" />
              <input name="price" value={form.price} onChange={handleChange} placeholder="Price" type="number" className="border px-3 py-2 rounded w-full" />
              <input name="stock" value={form.stock} onChange={handleChange} placeholder="Stock" type="number" className="border px-3 py-2 rounded w-full" />
              <input name="gst" value={form.gst} onChange={handleChange} placeholder="GST (%)" type="number" className="border px-3 py-2 rounded w-full" />
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button className="btn-secondary" onClick={handleCancel}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
