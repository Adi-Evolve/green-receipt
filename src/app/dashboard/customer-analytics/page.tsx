"use client";

import CustomerAnalytics from '../components/CustomerAnalytics';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import ServerNavbar from '../../../components/ServerNavbar';
import Footer from '../../../components/Footer';

function getCustomerTotalSpent(receipts: any[], customer: any) {
  return receipts
    .filter(r => (r.customerId || r.customer_id) === (customer.customerId || customer.id))
    .reduce((sum, r) => sum + (r.total || r.products?.reduce((s: number, p: any) => s + (p.price * p.quantity), 0) || 0), 0);
}

function getCustomersFromSources(businessId: string) {
  let customers: any[] = [];
  try {
    customers = JSON.parse(localStorage.getItem(`customers_${businessId}`) || '[]');
  } catch {}
  return customers;
}

function mergeCustomers(local: any[], remote: any[]) {
  const map = new Map();
  [...local, ...remote].forEach(c => {
    const key = c.customerId || c.id || c.email || c.phone;
    if (!map.has(key)) map.set(key, c);
  });
  return Array.from(map.values());
}

function CustomerProfilePanel({ customer, receipts, onClose }: { customer: any, receipts: any[], onClose: () => void }) {
  if (!customer) return null;
  const totalSpent = receipts.reduce((sum, r) => sum + (r.total || r.products?.reduce((s: number, p: any) => s + (p.price * p.quantity), 0) || 0), 0);
  const lastPurchase = receipts.length > 0 ? receipts[0].date || receipts[0].created_at?.split('T')[0] : '-';
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-red-500" onClick={onClose}>✕</button>
        <h2 className="text-xl font-bold mb-2">Customer Profile</h2>
        <div className="mb-4">
          <div><span className="font-semibold">Name:</span> {customer.name}</div>
          <div><span className="font-semibold">Phone:</span> {customer.phone}</div>
          <div><span className="font-semibold">Email:</span> {customer.email}</div>
          <div><span className="font-semibold">Total Spent:</span> ₹{totalSpent.toFixed(2)}</div>
          <div><span className="font-semibold">Last Purchase:</span> {lastPurchase}</div>
        </div>
        <div>
          <h3 className="font-semibold mb-1">Recent Receipts</h3>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-xs border">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Date</th>
                  <th className="border px-2 py-1">Receipt #</th>
                  <th className="border px-2 py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {receipts.slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    <td className="border px-2 py-1">{r.date || r.created_at?.split('T')[0]}</td>
                    <td className="border px-2 py-1">{r.receiptNumber || r.receipt_number || r.id}</td>
                    <td className="border px-2 py-1">₹{(r.total || r.products?.reduce((s: number, p: any) => s + (p.price * p.quantity), 0) || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerAnalyticsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerReceipts, setCustomerReceipts] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let code = '';
    if (typeof window !== 'undefined') {
      code = localStorage.getItem('user_code') || localStorage.getItem('businessId') || '';
    }
    async function fetchAll() {
      setLoading(true);
      let localReceipts: any[] = [];
      let localCustomers: any[] = [];
      if (code) {
        try {
          localReceipts = JSON.parse(localStorage.getItem(`receipts_${code}`) || '[]');
          localCustomers = JSON.parse(localStorage.getItem(`customers_${code}`) || '[]');
        } catch {}
      }
      let { data: supaReceipts, error: rErr } = await supabase.from('receipts').select('*').eq('businessId', code);
      let { data: supaCustomers, error: cErr } = await supabase.from('customers').select('*').eq('businessId', code);
      if (rErr) supaReceipts = [];
      if (cErr) supaCustomers = [];
      setReceipts([...(localReceipts || []), ...(supaReceipts || [])]);
      setCustomers(mergeCustomers(localCustomers || [], supaCustomers || []));
      setLoading(false);
    }
    fetchAll();
  }, []);

  const handleSelectCustomer = async (customer: any) => {
    setSelectedCustomer(customer);
    // Fetch receipts for this customer
    let custReceipts = receipts.filter(r => (r.customerId || r.customer_id) === (customer.customerId || customer.id));
    // Sort by date desc
    custReceipts.sort((a, b) => (b.date || b.created_at || '').localeCompare(a.date || a.created_at || ''));
    setCustomerReceipts(custReceipts);
  };

  const filteredCustomers = customers.filter((c: any) => {
    const q = search.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <main className="min-h-screen flex flex-col">
      <ServerNavbar isLoggedIn={true} />
      <div className="flex-grow bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold mb-6">Customer Analytics</h1>
          {loading ? (
            <div className="text-center py-10 text-lg text-gray-500">Loading receipts...</div>
          ) : (
            <div>
              <CustomerAnalytics receipts={receipts} />
              <div className="bg-white rounded shadow p-6 mb-8">
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Customers</h2>
                  <input
                    type="text"
                    placeholder="Search customers..."
                    className="border px-3 py-2 rounded"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Total Spent</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer: any) => (
                      <tr key={customer.customerId || customer.id}>
                        <td>{customer.name}</td>
                        <td>{customer.phone}</td>
                        <td>{customer.email}</td>
                        <td>₹{getCustomerTotalSpent(receipts, customer).toFixed(2)}</td>
                        <td><button className="btn-secondary" onClick={() => handleSelectCustomer(customer)}>View Profile</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {selectedCustomer && (
                <CustomerProfilePanel customer={selectedCustomer} receipts={customerReceipts} onClose={() => setSelectedCustomer(null)} />
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
