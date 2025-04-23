"use client";

import Link from 'next/link';
import ServerNavbar from '../../components/ServerNavbar';
import Footer from '../../components/Footer';
import DashboardCard from './components/DashboardCard';
import { FcSalesPerformance } from 'react-icons/fc';
import { MdLocalOffer } from 'react-icons/md';
import { FaRegFileAlt } from 'react-icons/fa';
import NotificationBell from '../components/NotificationBell';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import CustomerAnalytics from './components/CustomerAnalytics'; // Import the CustomerAnalytics component
import Papa from 'papaparse';
import JSZip from 'jszip';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default function DashboardPage() {
  // All hooks must be at the top, before any return
  const [hasMounted, setHasMounted] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [recentReceipts, setRecentReceipts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [userCode, setUserCode] = useState('');
  const [customers, setCustomers] = useState<Record<string, string>>({});
  const [showCustomerAnalytics, setShowCustomerAnalytics] = useState(false); // Add a state to show/hide the customer analytics modal
  const [alert, setAlert] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');
  const [salesChartData, setSalesChartData] = useState<any>(null);

  useEffect(() => { setHasMounted(true); }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const info = localStorage.getItem('businessInfo');
      if (info) {
        try {
          const parsed = JSON.parse(info);
          setBusinessName(parsed.businessName || parsed.name || '');
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    let parsed: any = null;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('businessInfo');
        if (saved) parsed = JSON.parse(saved);
      } catch {}
      setBusinessId(parsed?.user_code || parsed?.businessId || parsed?.id || '');
      setUserCode(parsed?.user_code || parsed?.businessId || parsed?.id || '');
    }
  }, [hasMounted]);

  useEffect(() => {
    if (!userCode) return;
    (async () => {
      // Try to fetch from Supabase
      let receipts: any[] = [];
      try {
        const { data, error } = await supabase
          .from('receipts')
          .select('*')
          .eq('user_code', userCode)
          .order('date', { ascending: false })
          .limit(5);
        if (data) receipts = data;
      } catch {}
      // If none, try localStorage fallback
      if (receipts.length === 0 && typeof window !== 'undefined') {
        try {
          const local = localStorage.getItem('receipts_' + userCode);
          if (local) receipts = JSON.parse(local).slice(-5).reverse();
        } catch {}
      }
      setRecentReceipts(receipts);
    })();
  }, [userCode]);

  useEffect(() => {
    if (!userCode) return;
    async function fetchStats() {
      const [rc, pc, cc] = await Promise.all([
        supabase.from('receipts').select('*').eq('user_code', userCode),
        supabase.from('products').select('*').eq('user_code', userCode),
        supabase.from('customers').select('*').eq('user_code', userCode),
      ]);
      setStats({
        receipts: rc.data?.length || 0,
        products: pc.data?.length || 0,
        customers: cc.data?.length || 0,
        totalSales: rc.data?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0,
      });
    }
    fetchStats();
  }, [userCode]);

  useEffect(() => {
    async function fetchCustomers() {
      const businessId = localStorage.getItem('businessInfo') ? JSON.parse(localStorage.getItem('businessInfo') || '{}').user_code || JSON.parse(localStorage.getItem('businessInfo') || '{}').businessId || JSON.parse(localStorage.getItem('businessInfo') || '{}').id || '' : '';
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
  }, [recentReceipts]);

  useEffect(() => {
    // Aggregate sales by month
    const monthly: Record<string, number> = {};
    recentReceipts.forEach(r => {
      const month = r.date?.slice(0, 7) || 'Unknown';
      monthly[month] = (monthly[month] || 0) + (r.total || 0);
    });
    setSalesChartData({
      labels: Object.keys(monthly),
      datasets: [{ label: 'Sales', data: Object.values(monthly), backgroundColor: '#22c55e' }]
    });
  }, [recentReceipts]);

  // Advanced Search & Filtering (example for receipts)
  const filteredReceipts = recentReceipts.filter(receipt => {
    const matchesQuery = searchQuery === '' || (receipt.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) || receipt.id?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDate = (!filterDateTo || new Date(receipt.date) <= new Date(filterDateTo));
    const matchesAmount = (!filterAmountMin || (receipt.total || 0) >= Number(filterAmountMin)) && (!filterAmountMax || (receipt.total || 0) <= Number(filterAmountMax));
    return matchesQuery && matchesDate && matchesAmount;
  });

  if (!hasMounted || typeof window === 'undefined') return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32"></div>
      <span className="ml-4 text-lg">Loading...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <ServerNavbar isLoggedIn={true} businessName={businessName} />
      <div className="max-w-5xl mx-auto py-8 px-4">
        {alert && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded shadow flex items-center">
            <span className="material-icons mr-2">error_outline</span>
            {alert}
          </div>
        )}
        <h1 className="text-3xl font-bold mb-8 text-primary-700">Business Management Dashboard</h1>
        {/* Main Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link href="/generate-receipt" className="px-6 py-4 rounded-lg font-semibold shadow bg-green-600 text-white hover:bg-green-700 transition-colors text-lg flex-1 text-center">
            Generate Receipt
          </Link>
          <Link href="/view-receipt" className="px-6 py-4 rounded-lg font-semibold shadow bg-green-600 text-white hover:bg-green-700 transition-colors text-lg flex-1 text-center">
            View Receipts
          </Link>
        </div>
        {/* Secondary Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link href="/dashboard/inventory-management" className="px-6 py-4 rounded-lg font-semibold shadow bg-green-900 text-white hover:bg-green-800 transition-colors text-lg flex-1 text-center">
            Inventory Management
          </Link>
          <Link href="/dashboard/customer-analytics" className="px-6 py-4 rounded-lg font-semibold shadow bg-green-900 text-white hover:bg-green-800 transition-colors text-lg flex-1 text-center">
            Customer Analysis
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Advanced Receipt Search & Filter</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <input type="text" placeholder="Search by customer or receipt ID" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input input-bordered" />
            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="input input-bordered" />
            <input type="number" placeholder="Min Amount" value={filterAmountMin} onChange={e => setFilterAmountMin(e.target.value)} className="input input-bordered w-32" />
            <input type="number" placeholder="Max Amount" value={filterAmountMax} onChange={e => setFilterAmountMax(e.target.value)} className="input input-bordered w-32" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.map((receipt: any) => (
                  <tr key={receipt.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{receipt.receiptNumber || receipt.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{receipt.customerName || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{receipt.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{receipt.total || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Sales Analytics (Monthly)</h2>
          <div className="w-full h-64">
            {salesChartData && (
              <canvas id="salesChart"></canvas>
            )}
          </div>
        </div>
        {salesChartData && (
          <script>
            {`
              const ctx = document.getElementById('salesChart').getContext('2d');
              const chart = new Chart(ctx, {
                type: 'bar',
                data: ${JSON.stringify(salesChartData)},
                options: {
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Monthly Sales'
                    }
                  }
                }
              });
            `}
          </script>
        )}
      </div>
      <Footer />
    </div>
  );
}