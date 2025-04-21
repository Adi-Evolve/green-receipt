"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';

export default function EditCustomerPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const businessId = localStorage.getItem('businessId');
    if (!businessId) return;
    supabase.from('customers').select('*').eq('business_id', businessId).then(({ data }) => setCustomers(data || []));
  }, []);

  const filteredCustomers = customers.filter(c => {
    return (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.toLowerCase().includes(search.toLowerCase()))
    );
  });

  function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setSelectedId(id);
    const cust = customers.find(c => c.id === id);
    if (cust) setForm({ name: cust.name, email: cust.email, phone: cust.phone });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      const { error: updateError } = await supabase.from('customers').update(form).eq('id', selectedId);
      if (updateError) throw updateError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update customer');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase.from('customers').delete().eq('id', selectedId);
      if (deleteError) throw deleteError;
      setCustomers(prev => prev.filter(c => c.id !== selectedId));
      setSelectedId('');
      setForm({ name: '', email: '', phone: '' });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to delete customer');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <ServerNavbar isLoggedIn={true} />
      <div className="flex-grow max-w-xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-primary-800 mb-6">Edit/Delete Customer</h1>
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full mb-2"
        />
        <form className="bg-white p-6 rounded shadow space-y-4" onSubmit={handleUpdate}>
          <select value={selectedId} onChange={handleSelect} className="w-full border border-gray-300 rounded px-3 py-2 mb-2">
            <option value="">Select Customer</option>
            {filteredCustomers.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.email || c.phone})</option>
            ))}
          </select>
          <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Name" className="w-full border-gray-300 rounded px-3 py-2" />
          <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email" className="w-full border-gray-300 rounded px-3 py-2" />
          <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="w-full border-gray-300 rounded px-3 py-2" />
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
