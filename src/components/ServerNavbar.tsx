"use client";
"use client";
import Link from 'next/link';
import React, { useEffect, useState } from "react";

interface ServerNavbarProps {
  isLoggedIn?: boolean;
  businessName?: string;
}

const ServerNavbar = ({ isLoggedIn = false, businessName }: ServerNavbarProps) => {
  return (
    <nav className="bg-primary-500 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center mr-2">
                <span className="text-primary-500 font-bold text-lg">GR</span>
              </div>
              <span className="font-bold text-xl tracking-tight">Green Receipt</span>
            </Link>
          </div>
          {/* Only profile, create bill design, recent receipts */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/create-bill-design" 
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-600"
            >
              Create Bill Design
            </Link>
            <Link 
              href="/generate-receipt" 
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-600"
            >
              Generate Receipt
            </Link>
            <div className="ml-4 flex items-center space-x-2">
              {/* Hydration-safe business name display */}
              <BusinessNameDisplay businessName={businessName} />
              <Link 
                href="/profile" 
                className="bg-primary-600 p-2 rounded-full hover:bg-primary-700"
              >
                {/* Profile Icon */}
                <span role="img" aria-label="Profile">👤</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Hydration-safe business name display
function BusinessNameDisplay({ businessName }: { businessName?: string }) {
  const [name, setName] = useState(businessName || "");
  useEffect(() => {
    if (!businessName && typeof window !== "undefined") {
      const info = localStorage.getItem("businessInfo");
      if (info) {
        try {
          const parsed = JSON.parse(info);
          setName(parsed.businessName || parsed.name || "");
        } catch {}
      }
    }
  }, [businessName]);
  if (!name) return null;
  return <span className="font-semibold text-base">{name}</span>;
}

export default ServerNavbar;