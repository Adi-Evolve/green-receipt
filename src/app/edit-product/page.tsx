"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';

export default function EditProductPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({ name: '', price: '', gst: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const businessId = localStorage.getItem('businessId');
    if (!businessId) return;
    supabase.from('products').select('*').eq('business_id', businessId).then(({ data }) => setProducts(data || []));
  }, []);

  const filteredProducts = products.filter(p => {
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
    );
  });

  function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setSelectedId(id);
    const prod = products.find(p => p.id === id);
    if (prod) setForm({ name: prod.name, price: prod.price, gst: prod.gst || '', description: prod.description || '' });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      const { error: updateError } = await supabase.from('products').update({
        name: form.name,
        price: parseFloat(form.price),
        gst: form.gst ? parseFloat(form.gst) : null,
        description: form.description
      }).eq('id', selectedId);
      if (updateError) throw updateError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase.from('products').delete().eq('id', selectedId);
      if (deleteError) throw deleteError;
      setProducts(prev => prev.filter(p => p.id !== selectedId));
      setSelectedId('');
      setForm({ name: '', price: '', gst: '', description: '' });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <ServerNavbar isLoggedIn={true} />
      <div className="flex-grow max-w-xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-primary-800 mb-6">Edit/Delete Product</h1>
        <input
          type="text"
          placeholder="Search by name or description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full mb-2"
        />
        <form className="bg-white p-6 rounded shadow space-y-4" onSubmit={handleUpdate}>
          <select value={selectedId} onChange={handleSelect} className="w-full border border-gray-300 rounded px-3 py-2 mb-2">
            <option value="">Select Product</option>
            {filteredProducts.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Name" className="w-full border-gray-300 rounded px-3 py-2" />
          <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="Price" className="w-full border-gray-300 rounded px-3 py-2" />
          <input type="number" name="gst" value={form.gst} onChange={handleChange} placeholder="GST (%)" className="w-full border-gray-300 rounded px-3 py-2" />
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full border-gray-300 rounded px-3 py-2" />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={loading || !selectedId}>{loading ? 'Updating...' : 'Update'}</button>
            <button type="button" onClick={handleDelete} className="btn-danger" disabled={loading || !selectedId}>Delete</button>
          </div>
          {success && <div className="text-green-600 mt-2">Success!</div>}
          {error && <div className="text-red-600 mt-2">{error}</div>}
        </form>
      </div>
      <Footer />
    </main>
  );
}
