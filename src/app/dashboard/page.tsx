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

  if (!hasMounted || typeof window === 'undefined') return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32"></div>
      <span className="ml-4 text-lg">Loading...</span>
    </div>
  );

  return (
    <main className="min-h-screen flex flex-col">
      <ServerNavbar isLoggedIn={true} businessName={businessName} />
      
      <div className="flex-grow bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-sm text-gray-600">
                Welcome back to your Green Receipt business portal. Your Business ID: <span className="font-medium">{businessId || 'N/A'}</span>
              </p>
            </div>
            <div className="flex items-center justify-end gap-4 mb-4">
              {/* Notification Bell - pass userId from auth/session */}
              <NotificationBell userId={businessId} />
            </div>
          </div>
          
          {/* Quick Action Buttons - Centered, grouped */}
          <div className="flex flex-wrap gap-4 mb-8 justify-center">
            {/* Group 1: Main Actions */}
            <div className="flex gap-2">
              <Link href="/generate-receipt" 
                className="btn-primary flex items-center text-base px-5 py-2 rounded-l-lg border-r-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Generate Receipt
              </Link>
              <Link href="/recent-receipts" className="btn-primary flex items-center text-base px-5 py-2 rounded-r-lg border-l-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                Recent Receipts
              </Link>
            </div>
            {/* Group 2: Add Actions */}
            <div className="flex gap-2">
              <Link href="/add-product" className="bg-white border border-primary-300 text-primary-700 flex items-center text-base px-5 py-2 rounded-l-lg hover:bg-primary-50 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Product
              </Link>
              <Link href="/add-customer" className="bg-white border border-primary-300 text-primary-700 flex items-center text-base px-5 py-2 rounded-r-lg hover:bg-primary-50 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v4m0 0a4 4 0 110 8 4 4 0 010-8zm0 0v4m0 4v4" /></svg>
                Add Customer
              </Link>
            </div>
          </div>

          {/* Sales, Offers, Drafts Buttons - with icons, reduced size */}
          <div className="flex flex-wrap gap-4 mb-8 justify-center">
            <Link href="/sales" className="btn-secondary flex flex-col items-center justify-center text-base px-4 py-3 w-28 h-20">
              <FcSalesPerformance className="text-3xl mb-1" />
              Sales
            </Link>
            <Link href="/offers" className="btn-secondary flex flex-col items-center justify-center text-base px-4 py-3 w-28 h-20">
              <MdLocalOffer className="text-3xl mb-1 text-yellow-600" />
              Offers
            </Link>
            <Link href="/drafts" className="btn-secondary flex flex-col items-center justify-center text-base px-4 py-3 w-28 h-20">
              <FaRegFileAlt className="text-3xl mb-1 text-blue-600" />
              Drafts
            </Link>
          </div>

          {/* Recent Receipts Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Receipts</h2>
              <button
                className="btn-secondary"
                onClick={() => window.location.href = '/dashboard/customer-analytics'}
              >
                Customer Analytics
              </button>
            </div>
            {recentReceipts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReceipts.map((receipt: any, index: number) => (
                      <tr key={receipt.id || index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {(() => {
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
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customers[receipt.customer_id || receipt.customerId || ''] || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {receipt.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{receipt.total || receipt.totalAmount || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <Link href={`/view-receipt/${receipt.id || receipt.receipt_id}`} className="text-primary-600 hover:text-primary-900">
                              View
                            </Link>
                            <Link href={`/view-receipt/${receipt.id || receipt.receipt_id}/print`} className="text-gray-600 hover:text-gray-900">
                              Print
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg">No receipts yet. Create your first receipt!</p>
              </div>
            )}
          </div>
          <Footer />
        </div>
      </div>
    </main>
  );
}