"use client";

import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';
import ReceiptEditor from './components/ReceiptEditor';

export default function CreateBillPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <ServerNavbar isLoggedIn={true} />
      
      <div className="flex-grow bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create Bill Design</h1>
            <p className="mt-2 text-sm text-gray-600">
              Design your custom receipt format. Toggle, edit, or remove any element or column. Save your preferred format for future receipts.
            </p>
          </div>
          
          <ReceiptEditor />
        </div>
      </div>
      
      <Footer />
    </main>
  );
} 