import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

// Helper: group receipts by customer
function groupByCustomer(receipts: any[]) {
  const map: Record<string, any[]> = {};
  receipts.forEach(r => {
    const cid = r.customer_id || r.customerId || 'Unknown';
    if (!map[cid]) map[cid] = [];
    map[cid].push(r);
  });
  return map;
}

// Helper: get product stats for a customer
function getProductStats(receipts: any[]) {
  const stats: Record<string, number> = {};
  receipts.forEach(r => {
    let products = r.products;
    if (typeof products === 'string') {
      try { products = JSON.parse(products); } catch {}
    }
    (products || []).forEach((p: any) => {
      stats[p.name] = (stats[p.name] || 0) + (p.quantity || 1);
    });
  });
  return stats;
}

export default function CustomerAnalytics({ receipts }: { receipts: any[] }) {
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  // Fetch customers from Supabase and localStorage
  useEffect(() => {
    async function fetchCustomers() {
      setLoading(true);
      let supaCustomers: any[] = [];
      let localCustomers: any[] = [];
      try {
        const { data } = await supabase.from('customers').select('*');
        if (data) supaCustomers = data;
      } catch {}
      try {
        const businessInfo = typeof window !== 'undefined' ? localStorage.getItem('businessInfo') : null;
        let businessId = '';
        if (businessInfo) {
          const parsed = JSON.parse(businessInfo);
          businessId = parsed.user_code || parsed.businessId || parsed.id || '';
        }
        if (businessId) {
          const local = localStorage.getItem('customers_' + businessId);
          if (local) localCustomers = JSON.parse(local);
        }
      } catch {}
      // Merge by email or phone (dedupe)
      const all = [...supaCustomers, ...localCustomers].filter(
        (c, i, arr) => arr.findIndex(x => (x.email && c.email && x.email === c.email) || (x.phone && c.phone && x.phone === c.phone)) === i
      );
      setAllCustomers(all);
      setLoading(false);
    }
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!search) return allCustomers;
    return allCustomers.filter(c =>
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [search, allCustomers]);

  // Map for quick lookup of receipts by customer id/email/phone
  const grouped = useMemo(() => groupByCustomer(receipts), [receipts]);

  // Try to match selectedCustomer by id/email/phone
  const selectedReceipts = useMemo(() => {
    if (!selectedCustomer) return [];
    const cust = allCustomers.find(c => c.id === selectedCustomer || c.email === selectedCustomer || c.phone === selectedCustomer);
    if (!cust) return [];
    // Try multiple keys
    return receipts.filter(r =>
      r.customer_id === cust.id ||
      r.customerId === cust.id ||
      r.customer_email === cust.email ||
      r.customer_phone === cust.phone
    );
  }, [selectedCustomer, allCustomers, receipts]);

  const selectedCustomerObj = allCustomers.find(c => c.id === selectedCustomer || c.email === selectedCustomer || c.phone === selectedCustomer);

  const productStats = getProductStats(selectedReceipts);
  const totalRemaining = selectedReceipts.reduce((sum, r) => sum + (r.amount_remaining || 0), 0);
  const totalSpent = selectedReceipts.reduce((sum, r) => sum + (r.amount_paid || 0), 0);
  const sortedDates = selectedReceipts.map(r => new Date(r.date)).sort((a, b) => a.getTime() - b.getTime());
  const firstPurchase = sortedDates[0] ? sortedDates[0].toLocaleDateString() : '-';
  const lastPurchase = sortedDates[sortedDates.length-1] ? sortedDates[sortedDates.length-1].toLocaleDateString() : '-';
  let mostFrequentProduct = '-';
  if (Object.keys(productStats).length > 0) {
    mostFrequentProduct = Object.entries(productStats).sort((a,b) => b[1]-a[1])[0][0];
  }
  const avgBillValue = selectedReceipts.length > 0 ? (selectedReceipts.reduce((sum, r) => sum + (r.total || 0), 0) / selectedReceipts.length).toFixed(2) : '-';

  return (
    <div>
      <div className="mb-4">
        <input
          className="border rounded px-3 py-2 w-full mb-2"
          placeholder="Search customers by name, email, or phone"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {loading ? (
          <div className="text-center py-4">Loading customers...</div>
        ) : (
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr>
                  <th className="px-4 py-2 border">Name</th>
                  <th className="px-4 py-2 border">Email</th>
                  <th className="px-4 py-2 border">Phone</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c, i) => (
                  <tr
                    key={c.id || c.email || c.phone || i}
                    className={`cursor-pointer hover:bg-primary-50 ${selectedCustomer === (c.id || c.email || c.phone) ? 'bg-primary-100' : ''}`}
                    onClick={() => setSelectedCustomer(c.id || c.email || c.phone)}
                  >
                    <td className="px-4 py-2 border font-semibold">{c.name || 'Unnamed'}</td>
                    <td className="px-4 py-2 border">{c.email || '-'}</td>
                    <td className="px-4 py-2 border">{c.phone || '-'}</td>
                    <td className="px-4 py-2 border">
                      <button
                        className="bg-primary-500 text-white px-3 py-1 rounded"
                        onClick={e => { e.stopPropagation(); setSelectedCustomer(c.id || c.email || c.phone); setShowProfile(true); }}
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-gray-500 py-4">No customers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selectedCustomer && (
        <>
          {/* Customer Summary Section */}
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded p-4 flex-1">
              <div><span className="font-semibold">Total Spent:</span> ₹{totalSpent.toLocaleString('en-IN')}</div>
              <div><span className="font-semibold">Total Remaining:</span> ₹{totalRemaining.toLocaleString('en-IN')}</div>
              <div><span className="font-semibold">First Purchase:</span> {firstPurchase}</div>
              <div><span className="font-semibold">Last Purchase:</span> {lastPurchase}</div>
              <div><span className="font-semibold">Most Frequent Product:</span> {mostFrequentProduct}</div>
              <div><span className="font-semibold">Average Bill Value:</span> ₹{avgBillValue}</div>
            </div>
            <button
              className="bg-primary-500 text-white px-4 py-2 rounded ml-0 md:ml-4 mt-4 md:mt-0"
              onClick={() => setShowProfile(true)}
            >
              View Profile
            </button>
          </div>
          {/* Customer Profile Modal */}
          {showProfile && selectedCustomerObj && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw] relative">
                <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setShowProfile(false)}>&times;</button>
                <h3 className="text-lg font-bold mb-4">Customer Profile</h3>
                <div className="space-y-2">
                  {selectedCustomerObj.name && <div><span className="font-semibold">Name:</span> {selectedCustomerObj.name}</div>}
                  {selectedCustomerObj.email && <div><span className="font-semibold">Email:</span> {selectedCustomerObj.email}</div>}
                  {selectedCustomerObj.phone && <div><span className="font-semibold">Phone:</span> {selectedCustomerObj.phone}</div>}
                  {selectedCustomerObj.address && <div><span className="font-semibold">Address:</span> {selectedCustomerObj.address}</div>}
                  {selectedCustomerObj.city && <div><span className="font-semibold">City:</span> {selectedCustomerObj.city}</div>}
                  {selectedCustomerObj.state && <div><span className="font-semibold">State:</span> {selectedCustomerObj.state}</div>}
                  {selectedCustomerObj.pincode && <div><span className="font-semibold">Pincode:</span> {selectedCustomerObj.pincode}</div>}
                  {/* Add more fields as needed, but only show if present */}
                </div>
              </div>
            </div>
          )}
          <div className="mb-4">
            <h4 className="font-semibold mb-2">All Bills Issued</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded shadow">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border">Receipt #</th>
                    <th className="px-4 py-2 border">Date</th>
                    <th className="px-4 py-2 border">Total</th>
                    <th className="px-4 py-2 border">Paid</th>
                    <th className="px-4 py-2 border">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReceipts.map((r, i) => (
                    <tr key={r.id || r.receipt_id || i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border">{r.receipt_number || r.id}</td>
                      <td className="px-4 py-2 border">{r.date}</td>
                      <td className="px-4 py-2 border">₹{r.total}</td>
                      <td className="px-4 py-2 border">₹{r.amount_paid || 0}</td>
                      <td className="px-4 py-2 border">₹{r.amount_remaining || 0}</td>
                    </tr>
                  ))}
                  {selectedReceipts.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-gray-500 py-4">No receipts found for this customer.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Products Purchased (Quantity)</h4>
            <div className="w-full h-48 bg-gray-100 rounded flex items-end gap-2 p-4">
              {Object.entries(productStats).map(([prod, qty]) => (
                <div key={prod} className="flex flex-col items-center justify-end">
                  <div className="bg-primary-500 text-white px-2 rounded-t" style={{height: Math.max(10, Number(qty) * 10)}}>{qty}</div>
                  <div className="text-xs mt-1">{prod}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Money Remaining to Pay</h4>
            <div className="text-lg font-bold text-red-600">₹{totalRemaining.toLocaleString('en-IN')}</div>
          </div>
        </>
      )}
    </div>
  );
}
