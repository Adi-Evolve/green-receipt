"use client";

import React, { useState, useEffect } from 'react';
import ServerNavbar from '../../components/ServerNavbar';
import Footer from '../../components/Footer';
import BackupRestorePanel from '../components/BackupRestorePanel';
import { getUserRole, RoleManager, setUserRole } from '../components/RoleManager';

const COLOR_THEMES = [
  { name: 'Green', value: 'green', class: 'bg-green-500' },
  { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
  { name: 'Gray', value: 'gray', class: 'bg-gray-700' },
];

// Helper to fetch all business data from backend for backup
async function getAllData(businessId: string) {
  const [products, customers, staff, expenses, invoices, reminders] = await Promise.all([
    fetch(`/api/products/${businessId}`).then(r => r.json()),
    fetch(`/api/customers/${businessId}`).then(r => r.json()),
    fetch(`/api/staff/${businessId}`).then(r => r.json()),
    fetch(`/api/expenses/${businessId}`).then(r => r.json()),
    fetch(`/api/invoices/${businessId}`).then(r => r.json()),
    fetch(`/api/reminders/${businessId}`).then(r => r.json()),
  ]);
  return { products, customers, staff, expenses, invoices, reminders };
}

export default function SettingsPage() {
  // All hooks must be at the top, before any return
  const [hasMounted, setHasMounted] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState('light');
  const [color, setColor] = useState('green');
  const [template, setTemplate] = useState('default');
  const [businessName, setBusinessName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [userCode, setUserCode] = useState('');
  const [businessId, setBusinessId] = useState('');
  const role = getUserRole();

  useEffect(() => { setHasMounted(true); }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTemplate = localStorage.getItem('receipt_template');
      if (savedTemplate) setTemplate(savedTemplate);
      const savedBusinessName = localStorage.getItem('business_name');
      if (savedBusinessName) setBusinessName(savedBusinessName);
      const savedWebhookUrl = localStorage.getItem('webhook_url');
      if (savedWebhookUrl) setWebhookUrl(savedWebhookUrl);
      const savedUserCode = localStorage.getItem('user_code');
      if (savedUserCode) setUserCode(savedUserCode);
      const savedBusinessId = localStorage.getItem('businessId');
      if (savedBusinessId) setBusinessId(savedBusinessId);
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) setTheme(savedTheme);
      const savedColor = localStorage.getItem('colorTheme');
      if (savedColor) setColor(savedColor);
    }
  }, []);

  if (!hasMounted) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32"></div>
      <span className="ml-4 text-lg">Loading...</span>
    </div>
  );

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      localStorage.setItem('colorTheme', color);
      alert('Settings saved!');
      window.location.reload();
    }
  }

  function saveSettings() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('receipt_template', template);
      localStorage.setItem('business_name', businessName);
      localStorage.setItem('webhook_url', webhookUrl);
      alert('Settings saved!');
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <ServerNavbar isLoggedIn={true} />
      <div className="flex-grow bg-gray-50">
        <div className="max-w-2xl mx-auto w-full p-4">
          <RoleManager />
          <h1 className="text-2xl font-bold mb-4">Settings & Customization</h1>
          <div className="mb-4">
            <label className="block mb-1 font-semibold">Receipt Template</label>
            <select value={template} onChange={e=>setTemplate(e.target.value)} className="border rounded px-2 py-1">
              <option value="default">Default</option>
              <option value="modern">Modern</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold">Business Name</label>
            <input value={businessName} onChange={e=>setBusinessName(e.target.value)} className="border rounded px-2 py-1 w-full" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold">Webhook URL (for integrations)</label>
            <input value={webhookUrl} onChange={e=>setWebhookUrl(e.target.value)} className="border rounded px-2 py-1 w-full" />
          </div>
          <button onClick={saveSettings} className="btn btn-green">Save Settings</button>
          <h1 className="text-2xl font-bold mb-4 mt-6">General Settings</h1>
          <form className="bg-white rounded shadow p-6 space-y-6" onSubmit={handleSave}>
            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={notifications} onChange={e => setNotifications(e.target.checked)} />
                Enable notifications
              </label>
            </div>
            <div>
              <label className="block font-medium mb-1">Theme</label>
              <select value={theme} onChange={e => setTheme(e.target.value)} className="border rounded px-3 py-2">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Color Theme</label>
              <div className="flex gap-3">
                {COLOR_THEMES.map(t => (
                  <button type="button" key={t.value} className={`w-8 h-8 rounded-full border-2 ${color === t.value ? 'border-black' : 'border-transparent'} ${t.class}`} onClick={() => setColor(t.value)} aria-label={t.name}></button>
                ))}
              </div>
            </div>
            <button type="submit" className="btn-primary">Save Settings</button>
          </form>
          <BackupRestorePanel businessId={businessId} getAllData={() => getAllData(businessId)} />
        </div>
      </div>
      <Footer />
    </main>
  );
}
