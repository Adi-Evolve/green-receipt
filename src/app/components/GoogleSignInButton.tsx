'use client';
import React from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function GoogleSignInButton() {
  async function handleGoogleSignIn() {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { scopes: 'profile email https://www.googleapis.com/auth/user.phonenumbers.read' } });
    if (error) {
      alert('Google sign-in failed: ' + error.message);
      return;
    }
    // Supabase will redirect, but if not, handle post-sign-in here
    // Save user data to localStorage and DB after redirect
  }
  return (
    <button
      className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 gap-2"
      onClick={handleGoogleSignIn}
      type="button"
    >
      <svg className="h-5 w-5 mr-2" viewBox="0 0 48 48">
        <g>
          <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.2 3.22l6.9-6.9C35.61 2.67 30.11 0 24 0 14.82 0 6.68 5.4 2.69 13.32l8.02 6.23C12.51 13.21 17.77 9.5 24 9.5z"/>
          <path fill="#34A853" d="M46.14 24.5c0-1.64-.15-3.2-.43-4.7H24v9.04h12.45c-.54 2.88-2.18 5.33-4.63 7.01l7.18 5.59C43.43 37.53 46.14 31.49 46.14 24.5z"/>
          <path fill="#FBBC05" d="M10.71 28.08A14.54 14.54 0 019.5 24c0-1.41.24-2.78.67-4.08l-8.02-6.23A23.92 23.92 0 000 24c0 3.77.91 7.34 2.52 10.46l8.19-6.38z"/>
          <path fill="#EA4335" d="M24 48c6.11 0 11.23-2.03 14.97-5.53l-7.18-5.59c-2.01 1.36-4.57 2.16-7.79 2.16-6.03 0-11.16-4.07-13-9.54l-8.19 6.38C6.68 42.6 14.82 48 24 48z"/>
          <path fill="none" d="M0 0h48v48H0z"/>
        </g>
      </svg>
      Sign in with Google
    </button>
  );
}
