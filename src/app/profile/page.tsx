"use client";

import React from 'react';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// Utility to generate a unique 6-digit code
function generateBusinessId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = React.useState({
    businessName: '',
    businessId: '',
    address: '',
    gst: '',
    email: '',
    phone: '',
    logo: null as File | null,
    logoUrl: '',
    terms: '',
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string|null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string|null>(null);
  const [showSummary, setShowSummary] = React.useState(false);
  const [editing, setEditing] = React.useState(false);

  // --- Registration Redirect Logic ---
  React.useEffect(() => {
    const user_code = typeof window !== 'undefined' ? localStorage.getItem('user_code') : null;
    if (!user_code) {
      // No account exists, redirect to registration
      window.location.href = '/register';
    }
  }, []);

  React.useEffect(() => {
    // --- Synchronize businessId and user_code everywhere ---
    let user_code = localStorage.getItem('user_code');
    let businessId = localStorage.getItem('businessId');
    // If both are missing, redirect to registration
    if (!user_code && !businessId) {
      window.location.href = '/register';
      return;
    }
    // If only one exists, set both to the same value
    if (user_code && !businessId) {
      localStorage.setItem('businessId', user_code);
      businessId = user_code;
    } else if (!user_code && businessId) {
      localStorage.setItem('user_code', businessId);
      user_code = businessId;
    }
    if (!user_code) {
      window.location.href = '/register';
      return;
    }
    // Always fetch latest user data from Supabase after registration
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('users').select('*').eq('user_code', user_code).single();
      if (data) {
        setForm((prev) => ({
          ...prev,
          businessName: data.name || '',
          businessId: data.user_code || '',
          address: data.address || '',
          gst: data.gst_number || '',
          email: data.email || '',
          phone: data.phone || '',
          logoUrl: data.logo_url || '', // <-- Ensure logoUrl is set from Supabase
          terms: data.terms || '',
        }));
        // --- Always update businessInfo with correct businessId ---
        localStorage.setItem('businessInfo', JSON.stringify({
          businessName: data.name || '',
          businessId: data.user_code || '',
          address: data.address || '',
          gst: data.gst_number || '',
          email: data.email || '',
          phone: data.phone || '',
          logoUrl: data.logo_url || '', // <-- Ensure logoUrl is set from Supabase
          terms: data.terms || '',
        }));
        // --- Synchronize both keys again after successful fetch ---
        localStorage.setItem('user_code', data.user_code);
        localStorage.setItem('businessId', data.user_code);
      } else if (error) {
        // If fetch fails, clear businessInfo to avoid showing stale data
        localStorage.removeItem('businessInfo');
        setForm(prev => ({ ...prev, businessId: '', businessName: '', address: '', gst: '', email: '', phone: '', logoUrl: '', terms: '' }));
      }
      setLoading(false);
    })();
  }, []);

  // When editing, if businessId is empty, auto-generate one
  React.useEffect(() => {
    if (editing && !form.businessId) {
      const newId = generateBusinessId();
      setForm(prev => ({ ...prev, businessId: newId }));
      localStorage.setItem('businessId', newId);
      localStorage.setItem('user_code', newId);
    }
  }, [editing, form.businessId]);

  // When mounting for new profile (no businessInfo, not editing), auto-generate businessId
  React.useEffect(() => {
    if (!localStorage.getItem('businessInfo') && !editing && !form.businessId) {
      const newId = generateBusinessId();
      setForm(prev => ({ ...prev, businessId: newId }));
      localStorage.setItem('businessId', newId);
      localStorage.setItem('user_code', newId);
    }
  }, [editing, form.businessId]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setForm(prev => ({ ...prev, logo: file }));
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoPreview(null);
    }
  }

  async function uploadLogo(file: File): Promise<string> {
    // Upload logo to imgbb
    const formData = new FormData();
    formData.append('image', file);
    // Using your actual imgbb API key
    const apiKey = '272785e1c6e6221d927bad99483ff9ed';
    const imgbbEndpoint = `https://api.imgbb.com/1/upload?key=${apiKey}`;
    const res = await fetch(imgbbEndpoint, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.success && data.data && data.data.url) return data.data.url;
    throw new Error(data.error?.message || 'Logo upload to imgbb failed');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    let logoUrl = form.logoUrl;
    try {
      if (form.logo) {
        logoUrl = await uploadLogo(form.logo);
        localStorage.setItem('logoUrl', logoUrl); // Cache logo URL in localStorage
      }
      // Save/update user profile in Supabase 'users' table (user-centric)
      let user_code = localStorage.getItem('user_code');
      let businessId = form.businessId || user_code;
      if (!businessId) {
        businessId = generateBusinessId();
        setForm(prev => ({ ...prev, businessId: businessId ?? '' })); // always string
        localStorage.setItem('user_code', businessId);
        localStorage.setItem('businessId', businessId);
        user_code = businessId;
      }
      if (!user_code) throw new Error('User code not found. Please register again.');
      // --- Check if email already exists (other than this user_code) ---
      const { data: existing, error: emailCheckError } = await supabase
        .from('users')
        .select('user_code')
        .eq('email', form.email);
      // Debug: Show all colliding user_codes
      if (Array.isArray(existing) && existing.length > 0 && existing.some((row: { user_code?: string }) => row.user_code && row.user_code !== businessId)) {
        const ids = existing.filter((row: { user_code?: string }) => row.user_code && row.user_code !== businessId).map((row: { user_code: string }) => row.user_code);
        throw new Error(`This email is already registered to another profile (user_code(s): ${ids.join(", ")}). Please use a different email or contact support to recover your account.`);
      }
      if (!Array.isArray(existing) && existing && (existing as { user_code?: string }).user_code && (existing as { user_code?: string }).user_code !== businessId) {
        throw new Error(`This email is already registered to another profile (user_code: ${(existing as { user_code: string }).user_code}). Please use a different email or contact support to recover your account.`);
      }
      const userPayload = {
        user_code: businessId,
        name: form.businessName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        gst_number: form.gst,
        logo_url: logoUrl, // Save imgbb URL in Supabase
        terms: form.terms,
      };
      // Upsert (insert or update) the user profile
      const { error } = await supabase.from('users').upsert([userPayload], { onConflict: 'user_code' });
      if (error) throw error;
      // Save to localStorage for fast UX
      localStorage.setItem('businessInfo', JSON.stringify({ ...form, logoUrl, businessId, user_code: businessId }));
      setShowSummary(true);
      setEditing(false);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  // --- Delete profile logic ---
  async function handleDeleteProfile() {
    if (!window.confirm('Are you sure you want to delete your profile? This action cannot be undone.')) return;
    const user_code = localStorage.getItem('user_code');
    if (user_code) {
      await supabase.from('users').delete().eq('user_code', user_code);
      // Wait and check if deletion succeeded
      let tries = 0;
      let stillExists = true;
      while (tries < 5 && stillExists) {
        const { data: check, error } = await supabase.from('users').select('user_code').eq('user_code', user_code);
        if (!check || check.length === 0) {
          stillExists = false;
        } else {
          await new Promise(res => setTimeout(res, 500));
          tries++;
        }
      }
      if (stillExists) {
        alert('Profile deletion failed. Please try again or contact support.');
        return;
      }
    }
    // Remove all business-related data from localStorage
    localStorage.removeItem('user_code');
    localStorage.removeItem('businessId');
    localStorage.removeItem('businessInfo');
    localStorage.removeItem('logoUrl');
    // Optionally clear all app data (uncomment to fully reset)
    // localStorage.clear();
    window.location.href = '/register'; // Redirect to registration after deletion
  }

  // --- Backup/Import logic ---
  function handleBackup() {
    if (typeof window === 'undefined') return;
    const allData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) allData[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `greenreceipt-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, value as string);
        });
        alert('Backup imported successfully! Please reload the page to see changes.');
      } catch {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
  }

  function handleExportCSVZip() {
    // Implement CSV/ZIP export logic here
  }

  const backupImportPanel = (
    <div className="flex justify-center gap-4 my-8">
      <button
        type="button"
        className="btn-secondary border border-primary-600 text-primary-700 bg-white hover:bg-primary-50 px-6 py-2 rounded font-semibold shadow-sm transition"
        onClick={handleBackup}
      >
        Export Backup (JSON)
      </button>
      <button
        type="button"
        className="btn-secondary border border-primary-600 text-primary-700 bg-white hover:bg-primary-50 px-6 py-2 rounded font-semibold shadow-sm transition"
        onClick={() => handleExportCSVZip()}
      >
        Export (CSV/ZIP)
      </button>
      <label
        className="btn-secondary border border-green-600 text-green-700 bg-white hover:bg-green-50 px-6 py-2 rounded font-semibold shadow-sm transition cursor-pointer"
        style={{marginBottom:0}}
      >
        Import/Restore Backup
        <input type="file" accept="application/json" style={{display:'none'}} onChange={handleImportBackup} />
      </label>
    </div>
  );

  if (loading) return <div className="p-8">Loading...</div>;

  if ((showSummary || localStorage.getItem('businessInfo')) && !editing) {
    // Show profile summary after save or if profile exists
    const businessInfo = showSummary ? { ...form } : JSON.parse(localStorage.getItem('businessInfo')!);
    return (
      <main className="min-h-screen flex flex-col bg-gray-50">
        <ServerNavbar isLoggedIn={true} businessName={businessInfo.businessName} />
        {backupImportPanel}
        <div className="flex-grow max-w-3xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-4 w-full">
                {businessInfo.logoUrl ? (
                  <img src={businessInfo.logoUrl} alt="Logo" className="h-24 w-24 rounded-full border-4 border-primary-100 shadow" />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-400 border-4 border-primary-100">
                    <span>Logo</span>
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-primary-800 mb-1">{businessInfo.businessName}</h2>
                  <div className="text-gray-600 text-sm mb-2">Business ID: <span className="font-mono">{businessInfo.businessId}</span></div>
                  <div className="text-gray-500 text-xs">GST: {businessInfo.gst}</div>
                </div>
              </div>
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <div className="font-semibold text-gray-700 mb-1">Address</div>
                  <div className="text-gray-900 whitespace-pre-line">{businessInfo.address}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700 mb-1">Contact</div>
                  <div className="text-gray-900">Email: {businessInfo.email}</div>
                  <div className="text-gray-900">Phone: {businessInfo.phone}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="font-semibold text-gray-700 mb-1">Terms & Conditions</div>
                  <div className="text-gray-900 whitespace-pre-line">{businessInfo.terms}</div>
                </div>
              </div>
              <button
                type="button"
                className="mt-6 px-6 py-2 rounded bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition"
                onClick={handleDeleteProfile}
              >
                Delete Profile
              </button>
            </div>
            <div className="flex flex-col items-center gap-4 min-w-[120px]">
              <button className="btn-primary w-full" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <ServerNavbar isLoggedIn={true} businessName={form.businessName} />
      {backupImportPanel}
      <div className="flex-grow max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-primary-800 mb-6">Business Profile</h1>
        <form className="bg-white rounded shadow p-6 space-y-4" onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row md:gap-8">
            <div className="flex-1 space-y-2">
              <div>
                <label className="font-medium block mb-1">Business Name</label>
                <input type="text" name="businessName" value={form.businessName} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" required />
              </div>
              <div>
                <label className="font-medium block mb-1">Business ID (User Code)</label>
                <input type="text" name="businessId" value={form.businessId} className="w-full border border-gray-300 rounded px-3 py-2" disabled />
              </div>
              <div>
                <label className="font-medium block mb-1">GST Number</label>
                <input type="text" name="gst" value={form.gst} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" required />
              </div>
              <div>
                <label className="font-medium block mb-1">Address</label>
                <textarea name="address" value={form.address} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" required />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <label className="font-medium block mb-1">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" required />
              </div>
              <div>
                <label className="font-medium block mb-1">Phone</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" required />
              </div>
              <div>
                <label className="font-medium block mb-1">Logo</label>
                <input type="file" name="logo" accept="image/*" onChange={handleLogoChange} className="w-full" />
                {logoPreview && (
                  <div className="flex items-center gap-2 mt-2">
                    <img src={logoPreview} alt="Logo Preview" className="h-16 rounded border" />
                    <button type="button" onClick={() => {
                      setForm(prev => ({ ...prev, logo: null, logoUrl: '', }));
                      setLogoPreview(null);
                      localStorage.removeItem('logoUrl');
                    }} className="ml-2 text-xs text-red-600 underline">Remove Logo</button>
                  </div>
                )}
                {form.logoUrl && !logoPreview && (
                  <div className="flex items-center gap-2 mt-2">
                    <img src={form.logoUrl} alt="Logo" className="h-16 rounded border" />
                    <button type="button" onClick={() => {
                      setForm(prev => ({ ...prev, logo: null, logoUrl: '', }));
                      setLogoPreview(null);
                      localStorage.removeItem('logoUrl');
                    }} className="ml-2 text-xs text-red-600 underline">Remove Logo</button>
                  </div>
                )}
              </div>
              <div>
                <label className="font-medium block mb-1">Terms & Conditions</label>
                <textarea name="terms" value={form.terms || ''} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" rows={3} placeholder="Enter your business terms and conditions here..." />
                <div className="text-xs text-gray-500 mt-1">These will appear automatically on every receipt you generate.</div>
              </div>
            </div>
          </div>
          {saveError && <div className="text-red-600 mb-2">{saveError}</div>}
          <div className="flex gap-4 mt-4">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
            <button type="button" className="btn-secondary" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
          </div>
        </form>
      </div>
      <Footer />
    </main>
  );
}
