"use client";
import React, { useEffect, useState } from 'react';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function RecentReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any>({});
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'time'|'amount'>('time');
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc');

  useEffect(() => {
    const businessId = localStorage.getItem('businessId');
    if (!businessId) {
      setError('Business profile not found.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    supabase
      .from('receipts')
      .select('*')
      .eq('user_code', businessId)
      .order('date', { ascending: sortOrder === 'asc' })
      .then(({ data, error }) => {
        if (error) {
          setError('Failed to load receipts');
          setReceipts([]);
        } else {
          setReceipts(data || []);
        }
        setLoading(false);
      });
  }, [sortOrder]);

  useEffect(() => {
    async function fetchCustomers() {
      const businessId = localStorage.getItem('businessId');
      if (!businessId) return;
      let customersMap: Record<string, string> = {};
      let local = localStorage.getItem('customers_' + businessId);
      if (local) {
        try {
          const arr = JSON.parse(local);
          arr.forEach((c: any) => {
            customersMap[c.customerId || c.id || c.name] = c.name;
          });
        } catch {}
      }
      // Fetch from Supabase as fallback
      const { data } = await supabase.from('customers').select('*').eq('user_code', businessId);
      if (data) {
        data.forEach((c: any) => {
          customersMap[c.customerId || c.id || c.name] = c.name;
        });
      }
      setCustomers(customersMap);
    }
    fetchCustomers();
  }, [receipts]);

  const filteredReceipts = receipts.filter(receipt => {
    const receiptNumber = (receipt.receipt_number || receipt.receiptNumber || receipt.id || '').toString();
    const customerId = receipt.customer_id || receipt.customerId || '';
    const customerName = customers[customerId] || '';
    return (
      (receiptNumber && receiptNumber.toLowerCase().includes(search.toLowerCase())) ||
      (customerName && customerName.toLowerCase().includes(search.toLowerCase()))
    );
  });

  // Sort receipts by selected sortBy and sortOrder
  const sortedReceipts = [...filteredReceipts].sort((a, b) => {
    if (sortBy === 'time') {
      // Use the receiptUniqueId (which embeds timestamp) for sorting if available, else fallback to date/createdAt
      const getTime = (r: any) => {
        if (r.receiptUniqueId) {
          // Format: businessId_timestamp_random
          const parts = r.receiptUniqueId.split('_');
          if (parts.length >= 2 && !isNaN(Number(parts[1]))) return Number(parts[1]);
        }
        // Fallbacks
        if (r.date && !isNaN(Date.parse(r.date))) return new Date(r.date).getTime();
        if (r.createdAt && !isNaN(Date.parse(r.createdAt))) return new Date(r.createdAt).getTime();
        if (r.created_at && !isNaN(Date.parse(r.created_at))) return new Date(r.created_at).getTime();
        return 0;
      };
      const timeA = getTime(a);
      const timeB = getTime(b);
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    } else if (sortBy === 'amount') {
      const amtA = Number(a.total || a.amount || 0);
      const amtB = Number(b.total || b.amount || 0);
      return sortOrder === 'asc' ? amtA - amtB : amtB - amtA;
    }
    return 0;
  });

  // Delete receipt from Supabase and localStorage
  async function handleDeleteReceipt(receipt: any) {
    if (!window.confirm('Are you sure you want to delete this receipt? This action cannot be undone.')) return;
    const businessId = localStorage.getItem('businessId');
    // Remove from Supabase
    let idField: 'id' | 'receipt_id' | 'qr_code' | null = receipt.id ? 'id' : receipt.receipt_id ? 'receipt_id' : receipt.qr_code ? 'qr_code' : null;
    if (!idField) {
      alert('Could not determine receipt ID field for deletion.');
      return;
    }
    await supabase.from('receipts').delete().eq(idField, receipt[idField]);
    // Remove from localStorage
    if (businessId) {
      const key = `receipts_${businessId}`;
      let arr = [];
      try {
        arr = JSON.parse(localStorage.getItem(key) || '[]');
      } catch {}
      arr = arr.filter((r: any) => r && r[idField] !== receipt[idField]);
      localStorage.setItem(key, JSON.stringify(arr));
    }
    setReceipts(prev => prev.filter(r => r && r[idField] !== receipt[idField]));
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <ServerNavbar isLoggedIn={true} />
      <div className="flex-grow max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-primary-800 mb-6">All Receipts</h1>
        <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Search by receipt number or customer name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-80"
            />
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="border rounded px-2 py-1">
              <option value="time">Time</option>
              <option value="amount">Amount</option>
            </select>
            <button className="ml-1 px-2 py-1 border rounded" onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}>
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
          {/* View Analytics button removed as per user request */}
        </div>
        <div className="bg-white rounded shadow p-6">
          {loading ? (
            <div>Loading receipts...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-primary-100 text-primary-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Receipt #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Customer Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedReceipts.map((receipt, idx) => (
                  <tr key={receipt.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{(() => {
                      const businessId = receipt.businessId || receipt.business_id || localStorage.getItem('businessId') || 'BIZ';
                      const billNo = receipt.receiptNumber || receipt.receipt_number || receipt.id;
                      let serial = '';
                      if (typeof billNo === 'number') {
                        serial = billNo.toString().padStart(2, '0');
                      } else if (typeof billNo === 'string') {
                        const match = billNo.match(/(\d+)$/);
                        serial = match ? match[1].padStart(2, '0') : '01';
                      } else {
                        serial = '01';
                      }
                      return `GR-${businessId}-${serial}`;
                    })()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customers[receipt.customer_id || receipt.customerId || ''] || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{receipt.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{Number(receipt.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/view-receipt/${receipt.receiptUniqueId || receipt.id}`} className="text-primary-600 hover:text-primary-900">View</Link>
                      <button className="ml-4 text-red-600 hover:text-red-900" onClick={() => handleDeleteReceipt(receipt)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
