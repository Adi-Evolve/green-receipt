"use client";

import React from 'react';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabaseClient';

const CUSTOMER_FIELDS = [
  { key: 'name', label: 'Customer Name', required: true },
  { key: 'customerId', label: 'Customer ID', required: false },
  { key: 'phone', label: 'Contact Number', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'address', label: 'Address', required: false },
  { key: 'dob', label: 'Date of Birth', required: false },
  { key: 'notes', label: 'Notes', required: false },
];

export default function AddCustomerPage() {
  const [step, setStep] = React.useState(1);
  const [businessId, setBusinessId] = React.useState('');
  const [selectedFields, setSelectedFields] = React.useState<string[]>(['name']);
  const [formatName, setFormatName] = React.useState('');
  const [formats, setFormats] = React.useState<any[]>([]);
  const [chosenFormat, setChosenFormat] = React.useState<any>(null);
  const [form, setForm] = React.useState<any>({ name: '' });
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const bizId = localStorage.getItem('businessId') || '';
    setBusinessId(bizId);
    // Load formats
    const arr = JSON.parse(localStorage.getItem(`customerFormats_${bizId}`) || '[]');
    setFormats(arr);
    if (arr.length) {
      setStep(2);
    }
  }, []);

  // Save format
  const saveFormat = () => {
    if (!formatName || !selectedFields.includes('name')) {
      setError('Format name and Customer Name are required.');
      return;
    }
    const arr = [...formats, { name: formatName, fields: selectedFields }];
    setFormats(arr);
    localStorage.setItem(`customerFormats_${businessId}`, JSON.stringify(arr));
    setFormatName('');
    setStep(2);
  };

  // Save customer
  const saveCustomer = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    if (!form.name) {
      setError('Customer Name is required.');
      setLoading(false);
      return;
    }
    // Prepare customer payload
    const customer = { ...form, format: chosenFormat?.name, user_code: businessId };
    try {
      // Save to Supabase
      const { error } = await supabase.from('customers').upsert([customer]);
      if (error) {
        setError('Failed to save to Supabase: ' + error.message);
        setLoading(false);
        return;
      }
      setSuccess(true);
      setForm({ name: '' });
      // Refresh local list from Supabase
      const { data } = await supabase.from('customers').select('*').eq('user_code', businessId);
      if (data) localStorage.setItem(`customers_${businessId}`, JSON.stringify(data));
      // Also update localStorage directly (for instant cache)
      let arr = [];
      try { arr = JSON.parse(localStorage.getItem(`customers_${businessId}`) || '[]'); } catch {}
      arr.push(customer);
      localStorage.setItem(`customers_${businessId}`, JSON.stringify(arr));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError('Unexpected error: ' + err.message);
      } else {
        setError('Unexpected error occurred.');
      }
    }
    setLoading(false);
  };

  // Import button for CSV/Excel
  function handleImportCustomers(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      // Simple CSV parse (assume header row)
      const lines = text.split(/\r?\n/).filter(Boolean);
      const headers = lines[0].split(',');
      const imported = lines.slice(1).map(line => {
        const vals = line.split(',');
        const obj: any = { user_code: businessId };
        headers.forEach((h, i) => obj[h.trim()] = vals[i]?.trim() || '');
        return obj;
      });
      // Save all to Supabase and localStorage
      await supabase.from('customers').upsert(imported);
      let arr = [];
      try { arr = JSON.parse(localStorage.getItem(`customers_${businessId}`) || '[]'); } catch {}
      arr = arr.concat(imported);
      localStorage.setItem(`customers_${businessId}`, JSON.stringify(arr));
      setSuccess(true);
    };
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <ServerNavbar isLoggedIn={true} />
      <div className="flex-grow max-w-xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-primary-800 mb-6">Add Customer</h1>
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${step===1?'bg-primary-600 text-white':'bg-gray-200'}`}>1. Create Format</span>
            <span className="text-gray-400">→</span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${step===2?'bg-primary-600 text-white':'bg-gray-200'}`}>2. Add Customer</span>
          </div>
          {step === 1 && (
            <div className="bg-white rounded shadow p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format Name</label>
                <input className="w-full border rounded p-2" value={formatName} onChange={e=>setFormatName(e.target.value)} placeholder="e.g. Basic Customer Format" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fields to include</label>
                <div className="flex flex-wrap gap-2">
                  {CUSTOMER_FIELDS.map(f=>(
                    <label key={f.key} className="flex items-center gap-1">
                      <input type="checkbox" checked={selectedFields.includes(f.key)} disabled={f.key==='name'} onChange={e=>{
                        if(e.target.checked) setSelectedFields([...selectedFields,f.key]);
                        else setSelectedFields(selectedFields.filter(k=>k!==f.key));
                      }} />
                      <span>{f.label}{f.required && ' *'}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button className="btn-primary mt-2" disabled={!formatName||!selectedFields.includes('name')} onClick={saveFormat}>Save Format & Continue</button>
            </div>
          )}
          {step === 2 && (
            <div className="bg-white rounded shadow p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Choose Format</label>
                <select className="w-full border rounded p-2 mb-4" value={chosenFormat?.name||''} onChange={e=>{
                  const f = formats.find((f: { name: string }) => f.name === e.target.value);
                  setChosenFormat(f);
                  setForm({ name: '' });
                }}>
                  <option value="">Select a format...</option>
                  {formats.map((f: { name: string }) => (<option key={f.name} value={f.name}>{f.name}</option>))}
                </select>
              </div>
              {chosenFormat && (
                <form className="space-y-4" onSubmit={e=>{e.preventDefault();saveCustomer();}}>
                  {chosenFormat.fields.map((key:string)=>(
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700">{CUSTOMER_FIELDS.find(f=>f.key===key)?.label || key}{key==='name' && ' *'}</label>
                      <input
                        type={key==='email'?'email':key==='phone'?'tel':key==='dob'?'date':'text'}
                        name={key}
                        value={form[key]||''}
                        onChange={e=>setForm((prev:any)=>({...prev,[key]:e.target.value}))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-600 focus:border-primary-600"
                        required={key==='name'}
                      />
                    </div>
                  ))}
                  <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Adding...' : 'Add Customer'}</button>
                  {success && <div className="text-green-600 mt-2">Customer added!</div>}
                  {error && <div className="text-red-600 mt-2">{error}</div>}
                </form>
              )}
            </div>
          )}
          <input type="file" accept=".csv,.xlsx" onChange={handleImportCustomers} className="mb-2" />
          <span className="text-xs text-gray-500">Import CSV/Excel (Tally, etc)</span>
        </div>
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Your Customers</h2>
          <CustomerList businessId={businessId} setError={setError} />
        </div>
      </div>
      <Footer />
    </main>
  );
}

function CustomerList({ businessId, setError }: { businessId: string, setError: (error: string | null) => void }) {
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [editingCustomer, setEditingCustomer] = React.useState<any>(null);
  const [editForm, setEditForm] = React.useState<any>({});
  React.useEffect(() => {
    if (!businessId) return;
    // Fetch customers from Supabase
    (async () => {
      const { data } = await supabase.from('customers').select('*').eq('user_code', businessId);
      if (data) setCustomers(data);
    })();
  }, [businessId]);
  const handleEdit = (cust: any) => {
    setEditingCustomer(cust);
    setEditForm({ ...cust });
  };
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleEditSave = async () => {
    try {
      // Update customer in Supabase
      const { error } = await supabase.from('customers').update(editForm);
      if (error) {
        setError('Failed to update customer in Supabase: ' + error.message);
        return;
      }
      // Fetch updated customers from Supabase
      const { data } = await supabase.from('customers').select('*').eq('user_code', businessId);
      if (data) setCustomers(data);
      setEditingCustomer(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError('Unexpected error: ' + err.message);
      } else {
        setError('Unexpected error occurred.');
      }
    }
  };
  if (!customers.length) return <div className="text-gray-500 text-sm">No customers yet.</div>;
  return (
    <ul className="divide-y divide-gray-200">
      {customers.map((c: any, idx:number) => (
        <li key={idx} className="py-2 flex justify-between text-sm items-center">
          {editingCustomer === c ? (
            <>
              <input className="border rounded px-1 mr-1" name="name" value={editForm.name} onChange={handleEditChange} required />
              {Object.keys(c).filter(k=>k!=='name'&&k!=='format').map(k=>(
                <input key={k} className="border rounded px-1 mr-1" name={k} value={editForm[k]||''} onChange={handleEditChange} />
              ))}
              <button className="ml-2 text-green-600 underline" onClick={handleEditSave}>Save</button>
              <button className="ml-2 text-gray-600 underline" onClick={()=>setEditingCustomer(null)}>Cancel</button>
            </>
          ) : (
            <>
              <span>{c.name}</span>
              <span className="text-gray-600">{c.phone||c.customerId||c.email}</span>
              <button className="ml-2 text-blue-500 underline" onClick={()=>handleEdit(c)}>Edit</button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
