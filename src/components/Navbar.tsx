import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface NavbarProps {
  isLoggedIn: boolean;
  businessName?: string;
}

const Navbar = ({ isLoggedIn, businessName }: NavbarProps) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bizName, setBizName] = useState(businessName || '');

  useEffect(() => {
    if (!businessName && typeof window !== 'undefined') {
      const saved = localStorage.getItem('businessInfo');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setBizName(parsed.businessName || parsed.name || 'Business User');
        } catch {}
      }
    }
  }, [businessName]);

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

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/' ? 'bg-primary-700 text-white' : 'hover:bg-primary-600'
              }`}
            >
              Home
            </Link>
            {isLoggedIn ? (
              <>
                <Link 
                  href="/dashboard" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/dashboard' ? 'bg-primary-700 text-white' : 'hover:bg-primary-600'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/generate-receipt" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/generate-receipt' ? 'bg-primary-700 text-white' : 'hover:bg-primary-600'
                  }`}
                >
                  Generate Receipt
                </Link>
                <div className="ml-4 flex items-center space-x-2">
                  <span className="text-sm font-medium">{bizName || 'Business User'}</span>
                  <Link 
                    href="/profile" 
                    className="bg-primary-600 p-2 rounded-full hover:bg-primary-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link 
                  href="/about" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/about' ? 'bg-primary-700 text-white' : 'hover:bg-primary-600'
                  }`}
                >
                  About
                </Link>
                <Link 
                  href="/contact" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/contact' ? 'bg-primary-700 text-white' : 'hover:bg-primary-600'
                  }`}
                >
                  Contact
                </Link>
                <Link 
                  href="/login" 
                  className="ml-4 px-4 py-2 rounded-md text-sm font-medium bg-white text-primary-600 hover:bg-gray-100"
                >
                  Login
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-primary-600 focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              href="/" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/' ? 'bg-primary-700 text-white' : 'hover:bg-primary-600'
              }`}
            >
              Home
            </Link>
            
            {isLoggedIn ? (
              <>
                <Link 
                  href="/dashboard" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === '/dashboard' ? 'bg-primary-700 text-white' : 'hover:bg-primary-600'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/generate-receipt" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === '/generate-receipt' ? 'bg-primary-700 text-white' : 'hover:bg-primary-600'
                  }`}
                >
                  Generate Receipt
                </Link>
                <Link 
                  href="/profile" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === '/profile' ? 'bg-primary-700 text-white' : 'hover:bg-primary-600'
                  }`}
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link 
                  href="/about" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === '/about' ? 'bg-primary-700 text-white' : 'hover:bg-primary-600'
                  }`}
                >
                  About
                </Link>
                <Link 
                  href="/contact" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === '/contact' ? 'bg-primary-700 text-white' : 'hover:bg-primary-600'
                  }`}
                >
                  Contact
                </Link>
                <Link 
                  href="/login" 
                  className="block px-3 py-2 rounded-md text-base font-medium bg-white text-primary-600 mt-1"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;