"use client";

import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import { FaFileDownload } from 'react-icons/fa';

const TIME_FILTERS = [
  { label: 'Day', value: 'day' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
];

export default function SalesPage() {
  const [salesData, setSalesData] = useState<any>(null);
  const [mostSelling, setMostSelling] = useState<any[]>([]);
  const [filter, setFilter] = useState('month');
  const [date, setDate] = useState('');

  useEffect(() => {
    // Fetch sales data from real receipts in localStorage
    const businessId = localStorage.getItem('businessId');
    if (!businessId) return;
    const localReceipts = localStorage.getItem(`receipts_${businessId}`);
    let receiptsArr = [];
    if (localReceipts) {
      try { receiptsArr = JSON.parse(localReceipts); } catch { receiptsArr = []; }
    }
    // Filter receipts by selected date and filter
    let filteredReceipts = receiptsArr;
    if (date) {
      filteredReceipts = receiptsArr.filter((r: any) => {
        let d = new Date(r.date || r.createdAt || r.created_at);
        if (filter === 'day') return d.toISOString().split('T')[0] === date;
        if (filter === 'month') return d.toISOString().slice(0,7) === date.slice(0,7);
        if (filter === 'year') return d.getFullYear().toString() === date.slice(0,4);
        return true;
      });
    }
    // Group by month for chart
    const monthlyTotals: Record<string, number> = {};
    receiptsArr.forEach((r: any) => {
      let dateStr = r.date || r.createdAt || r.created_at;
      let month = '-';
      if (dateStr) {
        const d = new Date(dateStr);
        month = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      }
      if (!monthlyTotals[month]) monthlyTotals[month] = 0;
      monthlyTotals[month] += Number(r.total || r.amount || 0);
    });
    const labels = Object.keys(monthlyTotals);
    const data = labels.map(m => monthlyTotals[m]);
    setSalesData({
      labels,
      datasets: [
        {
          label: 'Sales (₹)',
          data,
          backgroundColor: 'rgba(34,197,94,0.6)',
        },
      ],
    });
    // Most selling products
    const productMap: Record<string, { name: string, totalQty: number, totalSales: number }> = {};
    filteredReceipts.forEach((r: any) => {
      (r.products || []).forEach((p: any) => {
        if (!productMap[p.name]) productMap[p.name] = { name: p.name, totalQty: 0, totalSales: 0 };
        productMap[p.name].totalQty += Number(p.quantity || 0);
        productMap[p.name].totalSales += Number((p.price || 0) * (p.quantity || 0));
      });
    });
    const sellingArr = Object.values(productMap).sort((a, b) => b.totalQty - a.totalQty);
    setMostSelling(sellingArr);
  }, [filter, date]);

  function handleExportCSV() {
    const rows = [
      ['Month', 'Sales'],
      ...salesData.labels.map((label: string, i: number) => [label, salesData.datasets[0].data[i]])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(",")).join("\n");
    const a = document.createElement('a');
    a.href = encodeURI(csvContent);
    a.download = 'sales.csv';
    a.click();
  }

  return (
    <div>
      <ServerNavbar isLoggedIn={true} businessName="Sample Business Ltd." />
      <main className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Sales Analytics</h1>
        <div className="flex gap-4 mb-4 items-center">
          <label className="font-semibold">Show most selling products by:</label>
          <select className="border p-1 rounded" value={filter} onChange={e => setFilter(e.target.value)}>
            {TIME_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <input
            type={filter === 'day' ? 'date' : filter === 'month' ? 'month' : 'number'}
            className="border p-1 rounded"
            value={date}
            onChange={e => setDate(e.target.value)}
            placeholder={filter === 'year' ? 'YYYY' : ''}
            min={filter === 'year' ? '2000' : undefined}
            max={filter === 'year' ? new Date().getFullYear().toString() : undefined}
          />
        </div>
        {mostSelling.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2">Most Selling Products</h2>
            <table className="w-full border mb-2">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Product</th>
                  <th className="border px-2 py-1">Total Sold</th>
                  <th className="border px-2 py-1">Total Sales (₹)</th>
                </tr>
              </thead>
              <tbody>
                {mostSelling.map((p, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{p.name}</td>
                    <td className="border px-2 py-1">{p.totalQty}</td>
                    <td className="border px-2 py-1">₹{p.totalSales.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {salesData ? (
          <Bar data={salesData} options={{
            responsive: true,
            plugins: {
              legend: { display: true, position: 'top' },
              title: { display: true, text: 'Monthly Sales' },
            },
          }} />
        ) : (
          <div>Loading...</div>
        )}
        <button className="btn-primary flex items-center mt-6" onClick={handleExportCSV}>
          <FaFileDownload className="mr-2" /> Export CSV
        </button>
      </main>
      <Footer />
    </div>
  );
}
