import React, { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { supabase } from '@/lib/supabaseClient';

export default function SalesAnalyticsDashboard() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReceipts() {
      setLoading(true);
      setError(null);
      try {
        const businessId = typeof window !== 'undefined' ? localStorage.getItem('businessId') : '';
        let localReceipts: any[] = [];
        if (businessId) {
          try {
            localReceipts = JSON.parse(localStorage.getItem(`receipts_${businessId}`) || '[]');
          } catch {}
        }
        let { data: supaReceipts, error: supaError } = await supabase.from('receipts').select('*').eq('businessId', businessId);
        if (supaError) supaReceipts = [];
        setReceipts([...(localReceipts || []), ...(supaReceipts || [])]);
      } catch (err: any) {
        setError('Failed to load receipts');
      } finally {
        setLoading(false);
      }
    }
    fetchReceipts();
  }, []);

  // Prepare chart data
  const salesByDate: Record<string, number> = {};
  const productTotals: Record<string, number> = {};
  receipts.forEach(r => {
    const date = r.date || r.created_at?.split('T')[0];
    salesByDate[date] = (salesByDate[date] || 0) + (r.total || r.products?.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0) || 0);
    if (r.products) {
      r.products.forEach((p: any) => {
        productTotals[p.name] = (productTotals[p.name] || 0) + (p.price * p.quantity);
      });
    }
  });
  const dates = Object.keys(salesByDate).sort();
  const salesData = {
    labels: dates,
    datasets: [{
      label: 'Sales (₹)',
      data: dates.map(d => salesByDate[d]),
      backgroundColor: 'rgba(34,197,94,0.7)',
    }]
  };
  const productNames = Object.keys(productTotals);
  const productData = {
    labels: productNames,
    datasets: [{
      label: 'Total Sales',
      data: productNames.map(n => productTotals[n]),
      backgroundColor: productNames.map((_, i) => `hsl(${i * 40}, 70%, 60%)`),
    }]
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-6">Sales Analytics</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <>
          <div className="mb-10">
            <h3 className="font-semibold mb-2">Sales Over Time</h3>
            <Bar data={salesData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
          <div className="mb-10">
            <h3 className="font-semibold mb-2">Top Products</h3>
            <Pie data={productData} />
          </div>
        </>
      )}
    </div>
  );
}
