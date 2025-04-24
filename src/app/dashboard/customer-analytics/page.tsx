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

export default function CustomerAnalyticsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerReceipts, setCustomerReceipts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showProfile, setShowProfile] = useState(false);

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
    setShowProfile(true);
    let custReceipts = receipts.filter(r => (r.customerId || r.customer_id) === (customer.customerId || customer.id));
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold mb-6">Customer Analytics</h1>
          <div className="bg-white rounded shadow p-6 mb-8">
            <input
              type="text"
              placeholder="Search customers by name, phone, or email..."
              className="border px-3 py-2 rounded w-full mb-6"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <table className="w-full text-sm mb-4">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Remaining Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer: any) => {
                  const custReceipts = receipts.filter(r => (r.customerId || r.customer_id) === (customer.customerId || customer.id));
                  const totalPaid = custReceipts.reduce((sum, r) => sum + (r.amount_paid || 0), 0);
                  const totalDue = custReceipts.reduce((sum, r) => sum + ((r.total || 0) - (r.amount_paid || 0)), 0);
                  return (
                    <tr key={customer.customerId || customer.id}>
                      <td>{customer.name}</td>
                      <td>{customer.phone}</td>
                      <td>{customer.email}</td>
                      <td><span className="text-red-600 font-semibold">₹{totalDue.toFixed(2)}</span></td>
                      <td><button className="btn-secondary" onClick={() => handleSelectCustomer(customer)}>View Profile</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {showProfile && selectedCustomer && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                <button className="absolute top-2 right-2 text-gray-500 hover:text-red-500" onClick={() => setShowProfile(false)}>✕</button>
                <h2 className="text-xl font-bold mb-2">Customer Profile</h2>
                <div className="flex flex-col md:flex-row gap-6 mb-4">
                  <div className="flex-1 space-y-1">
                    <div><span className="font-semibold">Name:</span> {selectedCustomer.name}</div>
                    <div><span className="font-semibold">Phone:</span> {selectedCustomer.phone}</div>
                    <div><span className="font-semibold">Email:</span> {selectedCustomer.email}</div>
                    <div><span className="font-semibold">Address:</span> {selectedCustomer.address}</div>
                  </div>
                  <div className="flex-1 flex flex-col items-end">
                    <div className="text-right">
                      <div className="text-gray-500 text-sm">Remaining Amount</div>
                      <div className="text-2xl font-bold text-red-600">₹{customerReceipts.reduce((sum, r) => sum + ((r.total || 0) - (r.amount_paid || 0)), 0).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1 mt-4">Recent Receipts</h3>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-xs border">
                      <thead>
                        <tr>
                          <th className="border px-2 py-1">Date</th>
                          <th className="border px-2 py-1">Receipt #</th>
                          <th className="border px-2 py-1">Total</th>
                          <th className="border px-2 py-1">Amount Paid</th>
                          <th className="border px-2 py-1">Amount Due</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerReceipts.slice(0, 10).map((r, i) => (
                          <tr key={i}>
                            <td className="border px-2 py-1">{r.date || r.created_at?.split('T')[0]}</td>
                            <td className="border px-2 py-1">{r.receiptNumber || r.receipt_number || r.id}</td>
                            <td className="border px-2 py-1">₹{(r.total || r.products?.reduce((s: number, p: any) => s + (p.price * p.quantity), 0) || 0).toFixed(2)}</td>
                            <td className="border px-2 py-1">₹{(r.amount_paid || 0).toFixed(2)}</td>
                            <td className="border px-2 py-1 text-red-600 font-semibold">₹{((r.total || 0) - (r.amount_paid || 0)).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
