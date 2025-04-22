"use client";
import { useEffect, useState } from 'react';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardClient() {
  const [businessName, setBusinessName] = useState('');
  const [businessId, setBusinessId] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('businessInfo');
      if (saved) {
        const parsed = JSON.parse(saved);
        setBusinessName(parsed.businessName || parsed.name || 'Business User');
        setBusinessId(parsed.businessId || '');
      } else {
        setBusinessName('Business User');
        setBusinessId('');
      }
    }
  }, []);

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
              {/* <NotificationBell userId={businessId} /> */}
            </div>
          </div>
          {/* Quick Action Buttons - Centered */}
          <div className="flex flex-wrap gap-4 mb-8 justify-center">
            <Link 
              href="/generate-receipt" 
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-primary-700 transition-colors"
            >
              Generate Receipt
            </Link>
            <Link 
              href="/products" 
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-600 transition-colors"
            >
              Products
            </Link>
            <Link 
              href="/customers" 
              className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-green-600 transition-colors"
            >
              Customers
            </Link>
            <Link 
              href="/settings" 
              className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-gray-600 transition-colors"
            >
              Settings
            </Link>
          </div>
          {/* All analytics dashboard and tips sections removed as per user request */}
        </div>
      </div>
      <Footer />
    </main>
  );
}
