"use client";
import Link from 'next/link';
import Image from 'next/image';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    // Check for user authentication (e.g., token in localStorage)
    const user = localStorage.getItem('user');
    if (user) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleGetStarted = (e: React.MouseEvent) => {
    e.preventDefault();
    const user = localStorage.getItem('user');
    if (user) {
      router.replace('/dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <ServerNavbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold">
                Go Paperless with Digital Receipts
              </h1>
              <p className="text-xl">
                Create, manage, and share digital receipts with your customers.
                Green Receipt helps businesses save paper and provide better service.
              </p>
              <div className="pt-4">
                <button
                  className="btn-primary text-lg px-6 py-3"
                  onClick={handleGetStarted}
                >
                  Get Started
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative w-full max-w-md h-80">
                <div className="absolute inset-0 bg-white/90 rounded-lg shadow-xl p-4">
                  <div className="h-12 flex items-center border-b border-gray-200">
                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">GR</span>
                    </div>
                    <div className="ml-3 text-primary-500 font-semibold">Green Receipt</div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="bg-primary-100 p-3 rounded-md text-primary-700 text-sm">
                      Create digital receipts in minutes
                    </div>
                    <div className="bg-primary-100 p-3 rounded-md text-primary-700 text-sm">
                      Customize your receipt format
                    </div>
                    <div className="bg-primary-100 p-3 rounded-md text-primary-700 text-sm">
                      Generate QR codes automatically
                    </div>
                    <div className="bg-primary-100 p-3 rounded-md text-primary-700 text-sm">
                      Track all your transactions
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Features that Make a Difference
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Custom Receipt Templates</h3>
              <p className="text-gray-700">
                Design your own receipt templates with your business branding and choose which details to include.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">QR Code Integration</h3>
              <p className="text-gray-700">
                Automatically generate QR codes for your receipts, allowing customers to quickly access their receipt details.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Customer Database</h3>
              <p className="text-gray-700">
                Maintain a database of your customers and their purchase history for improved customer service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-secondary-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Go Green?</h2>
          <p className="text-xl max-w-3xl mx-auto mb-8">
            Join thousands of businesses reducing paper waste and improving customer experience with digital receipts.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/login" className="bg-white text-secondary-600 hover:bg-gray-100 px-6 py-3 rounded-md font-medium text-lg">
              Sign Up Now
            </Link>
            <Link href="/contact" className="bg-secondary-600 text-white hover:bg-secondary-700 px-6 py-3 rounded-md font-medium text-lg border border-white">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
} 