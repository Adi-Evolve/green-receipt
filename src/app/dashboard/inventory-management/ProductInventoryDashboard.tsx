"use client";

import React, { useEffect, useState } from 'react';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabaseClient';
import Papa from 'papaparse';

const PRODUCT_TYPES = [
  {
    type: 'general',
    label: 'General Store Product',
    fields: [
      { key: 'companyName', label: 'Company Name' },
      { key: 'productName', label: 'Product Name' },
      { key: 'price', label: 'Price' },
      { key: 'mrp', label: 'MRP' },
      { key: 'gst', label: 'GST (%)' },
    ],
  },
  {
    type: 'footwear',
    label: 'Footwear',
    fields: [
      { key: 'companyName', label: 'Company Name' },
      { key: 'productName', label: 'Product Name' },
      { key: 'size', label: 'Size' },
      { key: 'price', label: 'Price' },
      { key: 'mrp', label: 'MRP' },
      { key: 'gst', label: 'GST (%)' },
    ],
  },
  // ... (Add other product types as in add-product/page.tsx)
];

export default function ProductInventoryDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [businessId, setBusinessId] = useState('');

  // Fetch businessId on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('businessId') || '';
      setBusinessId(id);
    }
  }, []);

  // --- Stock Calculation Utility ---
  async function calculateStockForAllProducts(businessId: string) {
    // Fetch all products
    const { data: products, error: prodError } = await supabase.from('products').select('*').eq('user_code', businessId);
    if (prodError) return;
    // Fetch all receipts
    const { data: receipts, error: recError } = await supabase.from('receipts').select('*').eq('user_code', businessId);
    if (recError) return;
    // Calculate used quantities per product
    const used: Record<string, number> = {};
    (receipts || []).forEach((receipt: any) => {
      (receipt.products || []).forEach((prod: any) => {
        const sku = prod.sku || prod.id;
        if (!sku) return;
        used[sku] = (used[sku] || 0) + (prod.quantity || 0);
      });
    });
    // Compute new stock for each product
    const updates = (products || []).map((prod: any) => {
      const sku = prod.sku || prod.id;
      const origStock = prod.initial_stock !== undefined ? prod.initial_stock : prod.stock;
      const usedQty = used[sku] || 0;
      return {
        id: prod.id,
        stock: Math.max((origStock || 0) - usedQty, 0),
        initial_stock: origStock || 0,
      };
    });
    // Upsert products with new stock
    if (updates.length > 0) {
      await supabase.from('products').upsert(updates);
    }
  }

  // Fetch products from Supabase only, manual refresh
  async function fetchProducts() {
    setLoading(true);
    setError(null);
    if (!businessId) { setProducts([]); setLoading(false); return; }
    await calculateStockForAllProducts(businessId); // Ensure stock is up-to-date
    let { data, error } = await supabase.from('products').select('*').eq('user_code', businessId);
    if (error) { setError(error.message); setProducts([]); }
    else setProducts(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, [businessId]);

  // Manual refresh button
  const handleManualRefresh = async () => {
    setLoading(true);
    setError(null);
    if (!businessId) { setProducts([]); setLoading(false); return; }
    await calculateStockForAllProducts(businessId); // Ensure stock is up-to-date
    let { data, error } = await supabase.from('products').select('*').eq('user_code', businessId);
    if (error) { setError(error.message); setProducts([]); }
    else setProducts(data || []);
    setLoading(false);
  };

  // Search filter
  const filteredProducts = products.filter(p => {
    if (!p || typeof p !== 'object') return false;
    const name = (p.productName || p.name || '').toString();
    const sku = (p.sku || '').toString();
    return name.toLowerCase().includes(search.toLowerCase()) ||
      (sku && sku.toLowerCase().includes(search.toLowerCase()));
  });

  // Delete product
  async function handleDelete(product: any) {
    if (!window.confirm(`Delete product ${product.productName || product.name}?`)) return;
    await supabase.from('products').delete().eq('id', product.id);
    setProducts(products.filter(p => p.id !== product.id));
  }

  // Edit product
  function handleEdit(product: any) {
    setEditingProduct(product);
    setShowDialog(true);
    setSelectedFormat(PRODUCT_TYPES.find(t => t.type === product.type) || null);
    setForm(product);
  }

  // Add product (open dialog)
  function handleAddProduct() {
    setEditingProduct(null);
    setShowDialog(true);
    setSelectedFormat(null);
    setForm({});
  }

  // Save product (add or edit)
  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFormat) return;
    const newProduct = { ...form, user_code: businessId, type: selectedFormat.type, stock: form.stock };
    if (editingProduct) {
      await supabase.from('products').update(newProduct).eq('id', editingProduct.id);
    } else {
      await supabase.from('products').insert([newProduct]);
    }
    setShowDialog(false);
    setEditingProduct(null);
    setForm({});
    // Refresh products
    const { data } = await supabase.from('products').select('*').eq('user_code', businessId);
    setProducts(data || []);
  }

  // Export CSV
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

  // Import CSV
  async function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: async (results: any) => {
        if (results.data && Array.isArray(results.data)) {
          for (const prod of results.data) {
            await supabase.from('products').insert([{ ...prod, user_code: businessId }]);
          }
          const { data } = await supabase.from('products').select('*').eq('user_code', businessId);
          setProducts(data || []);
        }
      },
    });
  }

  // Handle form input change
  function handleFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <ServerNavbar isLoggedIn={true} businessName={businessId} />
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Product Inventory</h2>
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <input
              type="text"
              placeholder="Search products..."
              className="border border-primary-300 px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-primary-600 w-full sm:w-80"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="flex gap-2 items-center">
              <button
                className="bg-gray-500 text-white px-3 py-2 rounded font-semibold shadow hover:bg-gray-700 transition-colors flex items-center"
                onClick={handleManualRefresh}
                title="Refresh"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.581M5.077 19A9 9 0 0021 12.93M18.923 5A9 9 0 003 11.07" />
                </svg>
              </button>
              <button className="bg-blue-500 text-white px-4 py-2 rounded font-semibold shadow hover:bg-blue-600 transition-colors" onClick={handleExportCSV}>Export</button>
              <label className="bg-green-500 text-white px-4 py-2 rounded font-semibold shadow hover:bg-green-600 transition-colors cursor-pointer">
                Import
                <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
              </label>
              <button
                className="bg-primary-600 text-white px-4 py-2 rounded font-semibold shadow hover:bg-primary-700 transition-colors"
                onClick={handleAddProduct}
              >Add Product</button>
            </div>
          </div>
          {loading ? <div>Loading...</div> : error ? <div className="text-red-600">{error}</div> : (
            <div className="overflow-x-auto rounded shadow bg-white">
              <table className="w-full text-sm mb-4">
                <thead className="bg-primary-100">
                  <tr>
                    <th className="py-2 px-3 text-left">Name</th>
                    <th className="py-2 px-3 text-left">SKU</th>
                    <th className="py-2 px-3 text-left">Price</th>
                    <th className="py-2 px-3 text-left">Stock</th>
                    <th className="py-2 px-3 text-left">GST</th>
                    <th className="py-2 px-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p, i) => (
                    <tr key={i} className={p.stock !== undefined && p.stock <= 5 ? 'bg-red-50' : ''}>
                      <td className="py-2 px-3">{p.productName || p.name}</td>
                      <td className="py-2 px-3">{p.sku}</td>
                      <td className="py-2 px-3">₹{p.price}</td>
                      <td className="py-2 px-3">{p.stock !== undefined ? p.stock : '-'}</td>
                      <td className="py-2 px-3">{p.gst ? p.gst + '%' : '-'}</td>
                      <td className="py-2 px-3">
                        <button className="bg-yellow-400 text-white px-3 py-1 rounded mr-2 hover:bg-yellow-500" onClick={() => handleEdit(p)}>Edit</button>
                        <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600" onClick={() => handleDelete(p)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Add/Edit Product Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-red-500" onClick={() => { setShowDialog(false); setSelectedFormat(null); setEditingProduct(null); }}>✕</button>
            {!selectedFormat ? (
              <div>
                <h2 className="text-xl font-bold mb-4">Select Product Format</h2>
                <div className="grid grid-cols-1 gap-3">
                  {PRODUCT_TYPES.map((type) => (
                    <button
                      key={type.type}
                      className="bg-primary-100 hover:bg-primary-200 text-primary-800 px-4 py-2 rounded text-left font-semibold border border-primary-200"
                      onClick={() => setSelectedFormat(type)}
                    >{type.label}</button>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProduct} className="space-y-3">
                <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                {selectedFormat.fields.map((field: any) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                    <input
                      type={field.key === 'price' || field.key === 'mrp' || field.key === 'gst' ? 'number' : field.key === 'expiry' ? 'date' : 'text'}
                      name={field.key}
                      value={form[field.key] || ''}
                      onChange={handleFormChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-600 focus:border-primary-600"
                      required
                    />
                  </div>
                ))}
                {/* Stock input field (always shown) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Stock</label>
                  <input
                    type="number"
                    name="stock"
                    value={form.stock || ''}
                    onChange={e => setForm({ ...form, stock: Number(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-600 focus:border-primary-600"
                    required
                    min={0}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" className="btn-secondary" onClick={() => { setShowDialog(false); setSelectedFormat(null); setEditingProduct(null); }}>Cancel</button>
                  <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded font-semibold shadow hover:bg-primary-700 transition-colors">Save</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      <Footer />
    </main>
  );
}
