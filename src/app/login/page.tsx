"use client";
import Link from 'next/link';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';
import LoginForm from './components/LoginForm';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    // Redirect if user is already signed in
    const user = localStorage.getItem('user');
    if (user) {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col">
      <ServerNavbar />
      
      <div className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Log in to your business account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Or{' '}
              <Link 
                href="/register" 
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                register for a new account
              </Link>
            </p>
          </div>
          
          <LoginForm />
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <GoogleSignInButton />
            </div>
          </div>
          
          <div className="text-center mt-4">
            <Link 
              href="/"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
} 