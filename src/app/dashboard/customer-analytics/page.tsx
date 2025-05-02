"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import ServerNavbar from '../../../components/ServerNavbar';
import Footer from '../../../components/Footer';
import Papa from 'papaparse';

// Add Customer interface for type safety
interface Customer {
  id?: string;
  customerId?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  dob?: string;
  notes?: string;
  [key: string]: any;
}

const CUSTOMER_FIELDS = [
  { key: 'name', label: 'Customer Name', required: true },
  { key: 'customerId', label: 'Customer ID', required: false },
  { key: 'phone', label: 'Contact Number', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'address', label: 'Address', required: false },
  { key: 'dob', label: 'Date of Birth', required: false },
  { key: 'notes', label: 'Notes', required: false },
];

// Utility: Fetch receipts for a customer
async function fetchReceiptsForCustomer(customerId: string, businessId: string) {
  if (!customerId || !businessId) return [];
  const { data, error } = await supabase.from('receipts').select('*').eq('user_code', businessId).eq('customerId', customerId);
  if (error) return [];
  return data || [];
}

export default function CustomerAnalyticsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<any>({});
  const [selectedFields, setSelectedFields] = useState<string[]>(['name']);
  const [businessId, setBusinessId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('user_code') || localStorage.getItem('businessId') || '';
      setBusinessId(id);
    }
  }, []);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setLoading(true);
    setError(null);
    if (!businessId) { setCustomers([]); setLoading(false); return; }
    let { data, error } = await supabase.from('customers').select('*').eq('user_code', businessId);
    if (error) { setError(error.message); setCustomers([]); }
    else setCustomers(data || []);
    setLoading(false);
  };

  // Fetch customers from Supabase
  useEffect(() => {
    async function fetchCustomers() {
      setLoading(true);
      setError(null);
      if (!businessId) { setCustomers([]); setLoading(false); return; }
      let { data, error } = await supabase.from('customers').select('*').eq('user_code', businessId);
      if (error) { setError(error.message); setCustomers([]); }
      else setCustomers(data || []);
      setLoading(false);
    }
    fetchCustomers();
  }, [businessId]);

  // Search filter
  const filteredCustomers = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  // Export CSV
  function handleExportCSV() {
    const csv = Papa.unparse(customers);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
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
          for (const cust of results.data) {
            await supabase.from('customers').insert([{ ...cust, user_code: businessId }]);
          }
          const { data } = await supabase.from('customers').select('*').eq('user_code', businessId);
          setCustomers(data || []);
        }
      },
    });
  }

  // Add Customer (open dialog)
  function handleAddCustomer() {
    setEditingCustomer(null);
    setShowDialog(true);
    setForm({});
    setSelectedFields(['name']);
  }

  // Edit Customer
  function handleEditCustomer(cust: Customer) {
    setEditingCustomer(cust);
    setShowDialog(true);
    setForm({ ...cust });
    setSelectedFields(Object.keys(cust));
  }

  // Delete Customer
  async function handleDeleteCustomer(cust: Customer) {
    if (!window.confirm(`Delete customer ${cust.name}?`)) return;
    await supabase.from('customers').delete().eq('id', cust.id);
    setCustomers(customers.filter(c => c.id !== cust.id));
  }

  // Save Customer (add or edit)
  async function handleSaveCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) {
      setError('Customer Name is required.');
      return;
    }
    if (!businessId) {
      setError('Business profile not found.');
      return;
    }
    if (editingCustomer) {
      await supabase.from('customers').update({ ...form, user_code: businessId }).eq('id', editingCustomer.id);
    } else {
      await supabase.from('customers').insert([{ ...form, user_code: businessId }]);
    }
    setShowDialog(false);
    setEditingCustomer(null);
    setForm({});
    // Refresh customers
    const { data } = await supabase.from('customers').select('*').eq('user_code', businessId);
    setCustomers(data || []);
  }

  // Handle form input change
  function handleFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // CustomerReceiptsSection Component
  function CustomerReceiptsSection({ customerId, businessId }: { customerId: string, businessId: string }) {
    const [receipts, setReceipts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (!customerId || !businessId) return;
      setLoading(true);
      fetchReceiptsForCustomer(customerId, businessId).then(setReceipts).catch(() => setReceipts([])).finally(() => setLoading(false));
    }, [customerId, businessId]);

    // Delete a receipt
    const handleDeleteReceipt = async (receiptId: string) => {
      if (!window.confirm('Are you sure you want to delete this receipt?')) return;
      await supabase.from('receipts').delete().eq('id', receiptId);
      setReceipts(receipts.filter(r => r.id !== receiptId));
    };

    if (loading) return <div className="mt-4">Loading receipts...</div>;
    if (error) return <div className="mt-4 text-red-600">{error}</div>;
    if (!receipts.length) return <div className="mt-4 text-gray-500">No receipts found for this customer.</div>;

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Recent Receipts</h3>
        <table className="w-full text-xs mb-2 border">
          <thead>
            <tr>
              <th className="py-1 px-2 text-left">Date</th>
              <th className="py-1 px-2 text-left">Receipt #</th>
              <th className="py-1 px-2 text-left">Total</th>
              <th className="py-1 px-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((r) => (
              <tr key={r.id}>
                <td className="py-1 px-2">{r.date || '-'}</td>
                <td className="py-1 px-2">{r.receiptNumber || r.id}</td>
                <td className="py-1 px-2">₹{r.total || r.amount || '-'}</td>
                <td className="py-1 px-2">
                  <button className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600" onClick={() => handleDeleteReceipt(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <ServerNavbar isLoggedIn={true} businessName={businessId} />
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Customer Analytics</h2>
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <input
              type="text"
              placeholder="Search customers..."
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
                onClick={handleAddCustomer}
              >Add Customer</button>
            </div>
          </div>
          {loading ? <div>Loading...</div> : error ? <div className="text-red-600">{error}</div> : (
            <div className="overflow-x-auto rounded shadow bg-white">
              <table className="w-full text-sm mb-4">
                <thead className="bg-primary-100">
                  <tr>
                    <th className="py-2 px-3 text-left">Name</th>
                    <th className="py-2 px-3 text-left">Phone</th>
                    <th className="py-2 px-3 text-left">Email</th>
                    <th className="py-2 px-3 text-left">Address</th>
                    <th className="py-2 px-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3">{c.name}</td>
                      <td className="py-2 px-3">{c.phone}</td>
                      <td className="py-2 px-3">{c.email}</td>
                      <td className="py-2 px-3">{c.address}</td>
                      <td className="py-2 px-3">
                        <button className="bg-yellow-400 text-white px-3 py-1 rounded mr-2 hover:bg-yellow-500" onClick={() => handleEditCustomer(c)}>Edit</button>
                        <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600" onClick={() => handleDeleteCustomer(c)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Add/Edit Customer Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-red-500" onClick={() => { setShowDialog(false); setEditingCustomer(null); setForm({}); }}>✕</button>
            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <h2 className="text-xl font-bold mb-4">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h2>
              {CUSTOMER_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                  <input
                    type={field.key === 'dob' ? 'date' : 'text'}
                    name={field.key}
                    value={form[field.key] || ''}
                    onChange={handleFormChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-600 focus:border-primary-600"
                    required={field.required}
                  />
                </div>
              ))}
              {/* Show recent receipts if editing an existing customer */}
              {editingCustomer && (
                <CustomerReceiptsSection customerId={(editingCustomer.customerId || editingCustomer.id) ?? ''} businessId={businessId} />
              )}
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="btn-secondary" onClick={() => { setShowDialog(false); setEditingCustomer(null); setForm({}); }}>Cancel</button>
                <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded font-semibold shadow hover:bg-primary-700 transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </main>
  );
}
