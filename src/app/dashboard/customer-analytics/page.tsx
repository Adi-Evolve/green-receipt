"use client";

import CustomerAnalytics from '../components/CustomerAnalytics';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import ServerNavbar from '../../../components/ServerNavbar';
import Footer from '../../../components/Footer';

export default function CustomerAnalyticsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCode, setUserCode] = useState('');

  useEffect(() => {
    let code = '';
    if (typeof window !== 'undefined') {
      const info = localStorage.getItem('businessInfo');
      if (info) {
        try {
          const parsed = JSON.parse(info);
          code = parsed.user_code || parsed.businessId || parsed.id || '';
        } catch {}
      }
    }
    setUserCode(code);
  }, []);

  useEffect(() => {
    if (!userCode) return;
    setLoading(true);
    (async () => {
      let data: any[] = [];
      try {
        const res = await supabase
          .from('receipts')
          .select('*')
          .eq('user_code', userCode)
          .order('date', { ascending: false });
        if (res.data) data = res.data;
      } catch {}
      // Fallback to localStorage
      if (data.length === 0 && typeof window !== 'undefined') {
        try {
          const local = localStorage.getItem('receipts_' + userCode);
          if (local) data = JSON.parse(local);
        } catch {}
      }
      setReceipts(data);
      setLoading(false);
    })();
  }, [userCode]);

  return (
    <main className="min-h-screen flex flex-col">
      <ServerNavbar isLoggedIn={true} />
      <div className="flex-grow bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold mb-6">Customer Analytics</h1>
          {loading ? (
            <div className="text-center py-10 text-lg text-gray-500">Loading receipts...</div>
          ) : (
            <CustomerAnalytics receipts={receipts} />
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
