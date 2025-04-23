"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import SalesAnalyticsDashboard from './SalesAnalyticsDashboard';

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
    <div className="min-h-screen bg-gray-50">
      <SalesAnalyticsDashboard />
    </div>
  );
}
