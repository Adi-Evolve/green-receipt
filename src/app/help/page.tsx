"use client";

import React from 'react';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';

export default function HelpPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <ServerNavbar isLoggedIn={true} />
      <div className="flex-grow bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold mb-6">Help & Support</h1>
          <div className="bg-white rounded shadow p-6 space-y-4">
            <div>
              <h2 className="font-semibold mb-2">Frequently Asked Questions</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>How do I generate a new receipt?</li>
                <li>How do I add a new customer or product?</li>
                <li>How can I customize my bill design?</li>
                <li>How do I contact support?</li>
              </ul>
            </div>
            <div>
              <h2 className="font-semibold mb-2">Contact Support</h2>
              <p>Email: <a href="mailto:support@greenreceipt.com" className="text-primary-700 underline">support@greenreceipt.com</a></p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
