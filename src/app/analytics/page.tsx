"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const SalesBarChart = dynamic(() => import('./SalesBarChart'), { ssr: false });
const TopPieChart = dynamic(() => import('./TopPieChart'), { ssr: false });

export default function AnalyticsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSales, setTotalSales] = useState(0);
  const [totalReceipts, setTotalReceipts] = useState(0);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const businessId = localStorage.getItem('businessId');
    if (!businessId) {
      setError('Business profile not found.');
      setLoading(false);
      return;
    }
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const { data: receiptsData, error: receiptsError } = await supabase
          .from('receipts')
          .select('*')
          .eq('business_id', businessId);
        if (receiptsError) throw receiptsError;
        setReceipts(receiptsData || []);
        setTotalReceipts(receiptsData.length);
        setTotalSales(receiptsData.reduce((sum, r) => sum + (Number(r.total) || 0), 0));
        // Top Customers
        const custMap: any = {};
        receiptsData.forEach((r: any) => {
          if (!custMap[r.customer_id]) custMap[r.customer_id] = 0;
          custMap[r.customer_id] += Number(r.total) || 0;
        });
        const topCustArr = Object.entries(custMap).sort((a, b) => b[1] as number - (a[1] as number)).slice(0, 5);
        setTopCustomers(topCustArr);
        // Top Products
        const prodMap: any = {};
        receiptsData.forEach((r: any) => {
          (r.products || []).forEach((p: any) => {
            if (!prodMap[p.name]) prodMap[p.name] = 0;
            prodMap[p.name] += (p.amount || 0);
          });
        });
        const topProdArr = Object.entries(prodMap).sort((a, b) => b[1] as number - (a[1] as number)).slice(0, 5);
        setTopProducts(topProdArr);
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Prepare chart data
  const barData = [
    { name: 'Total Sales', value: totalSales },
    { name: 'Total Receipts', value: totalReceipts },
  ];
  const topCustomerData = topCustomers.map(([id, amount]) => ({ name: `Cust ${id}`, value: Number(amount) }));
  const topProductData = topProducts.map(([name, amount]) => ({ name, value: Number(amount) }));

  function handleExport() {
    setExporting(true);
    const csvRows = [
      ['Receipt #', 'Date', 'Customer ID', 'Total'],
      ...receipts.map(r => [r.receipt_number || r.id, r.date, r.customer_id, r.total])
    ];
    const csv = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics.csv';
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      setExporting(false);
    }, 1000);
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <ServerNavbar isLoggedIn={true} />
      <div className="flex-grow max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-primary-800 mb-6">Business Analytics</h1>
        <div className="mb-4 flex justify-between items-center">
          <Link href="/recent-receipts" className="btn-primary">Back to Receipts</Link>
          <button onClick={handleExport} className="btn-secondary" disabled={exporting}>{exporting ? 'Exporting...' : 'Export CSV'}</button>
        </div>
        <div className="bg-white rounded shadow p-6">
          {loading ? (
            <div>Loading analytics...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <>
              <div className="mb-4 text-lg font-semibold">Total Sales: ₹{totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="mb-4 text-lg font-semibold">Total Receipts: {totalReceipts}</div>
              {/* Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <SalesBarChart data={barData} />
                <TopPieChart data={topCustomerData} title="Top Customers" />
                <TopPieChart data={topProductData} title="Top Products" />
              </div>
              <div className="mb-4">
                <h2 className="font-semibold mb-2">Top Customers</h2>
                <ul className="list-disc ml-6">
                  {topCustomers.map(([id, amount], idx) => (
                    <li key={id}>Customer {id}: ₹{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="font-semibold mb-2">Top Products</h2>
                <ul className="list-disc ml-6">
                  {topProducts.map(([name, amount], idx) => (
                    <li key={name}>{name}: ₹{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
