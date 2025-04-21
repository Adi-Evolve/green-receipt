"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabaseClient';

export default function ViewReceiptPage() {
  const params = useParams();
  const receiptId = params?.id || '';
  const [receipt, setReceipt] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!receiptId) return;
    async function fetchReceipt() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: recErr } = await supabase.from('receipts').select('*').eq('id', receiptId).single();
        if (recErr) throw recErr;
        setReceipt(data);
        if (data && data.customer_id) {
          const { data: custData } = await supabase.from('customers').select('*').eq('id', data.customer_id).single();
          setCustomer(custData);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load receipt');
      } finally {
        setLoading(false);
      }
    }
    fetchReceipt();
  }, [receiptId]);

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <ServerNavbar isLoggedIn={true} />
      <div className="flex-grow max-w-2xl mx-auto px-4 py-12">
        {loading ? (
          <div>Loading receipt...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : receipt ? (
          <>
            <h1 className="text-2xl font-bold text-primary-800 mb-6">Receipt #{receipt.receipt_number || receipt.id}</h1>
            <div className="bg-white rounded shadow p-6">
              <div className="mb-2 font-medium">{receipt.business_name || 'Business'}</div>
              <div className="mb-2 text-sm text-gray-500">Date: {receipt.date}</div>
              <div className="mb-2 text-sm text-gray-500">Customer: {customer ? customer.name : receipt.customer_id}</div>
              <table className="min-w-full mt-4 mb-4">
                <thead>
                  <tr className="bg-primary-100 text-primary-900">
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">Qty</th>
                    <th className="px-3 py-2">GST (%)</th>
                    <th className="px-3 py-2">Price</th>
                    <th className="px-3 py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(receipt.products || []).map((item: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2">{item.quantity}</td>
                      <td className="px-3 py-2">{item.gst}</td>
                      <td className="px-3 py-2">₹{item.price}</td>
                      <td className="px-3 py-2">₹{item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="font-semibold text-right mb-2">Total: ₹{Number(receipt.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              {receipt.terms && <div className="text-xs text-gray-500 mb-1">Terms: {receipt.terms}</div>}
              {receipt.warranty && <div className="text-xs text-gray-500 mb-1">Warranty: {receipt.warranty}</div>}
              {receipt.returnDays && <div className="text-xs text-gray-500">Return Days: {receipt.returnDays}</div>}
            </div>
          </>
        ) : (
          <div>No receipt found.</div>
        )}
      </div>
      <Footer />
    </main>
  );
}
