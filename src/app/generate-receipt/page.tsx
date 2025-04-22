"use client";

import React, { useEffect, useState } from 'react';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';
import QRCode from 'qrcode.react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { supabase } from '@/lib/supabaseClient';

interface Product {
  id: string;
  name: string;
  quantity: number;
  gst: number;
  price: number;
  amount: number;
  discount?: number;
}

interface ReceiptFormat {
  columns: {
    product: boolean;
    quantity: boolean;
    gst: boolean;
    price: boolean;
    amount: boolean;
    serial?: boolean;
    discount?: boolean;
  };
  elements: {
    logo: boolean;
    businessInfo: boolean;
    customerInfo: boolean;
    termsAndConditions: boolean;
    warranty: boolean;
    qrCode: boolean;
    signature?: boolean;
    notes?: boolean;
  };
  font?: string;
  color?: string;
  layout?: string;
  showBorder?: boolean;
  showGrid?: boolean;
  preview?: boolean;
}

interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  gst: string;
  businessId: string;
  logoUrl?: string;
  terms?: string;
}

const defaultFormat: ReceiptFormat = {
  columns: {
    product: true,
    quantity: true,
    gst: true,
    price: true,
    amount: true,
  },
  elements: {
    logo: true,
    businessInfo: true,
    customerInfo: true,
    termsAndConditions: false, // hide from receipt form
    warranty: true,
    qrCode: true,
  },
};

const defaultBusinessInfo: BusinessInfo = {
  name: '',
  address: '',
  phone: '',
  email: '',
  gst: '',
  businessId: '',
  terms: '',
};

export default function GenerateReceiptPage() {
  const [hasMounted, setHasMounted] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [format, setFormat] = useState<ReceiptFormat | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [date, setDate] = useState('');
  const [warranty, setWarranty] = useState('');
  const [returnDays, setReturnDays] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [productSuggestions, setProductSuggestions] = useState<any[]>([]);
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [allFormats, setAllFormats] = useState<{ name: string; designData: ReceiptFormat }[]>([]);
  const [selectedFormatName, setSelectedFormatName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gst: '',
  });
  const [addingCustomer, setAddingCustomer] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    let bizInfo: any = null;
    let bizId = '';
    const savedBiz = localStorage.getItem('businessInfo');
    if (savedBiz) {
      try {
        bizInfo = JSON.parse(savedBiz);
        bizId = bizInfo.businessId || (bizInfo as any).user_code || '';
      } catch {}
    }
    setBusinessInfo(bizInfo);
    if (bizId) {
      let all = [];
      try {
        const arr = JSON.parse(localStorage.getItem(`billDesigns_${bizId}`) || '[]');
        if (Array.isArray(arr)) all = arr;
      } catch {
        all = [];
      }
      setAllFormats(all);
      if (all.length > 0) {
        setFormat(all[0].designData);
        setSelectedFormatName(all[0].name);
      }
      if (all.length === 0) {
        setFormat({
          columns: { product: true, quantity: true, gst: true, price: true, amount: true },
          elements: { logo: true, businessInfo: true, customerInfo: true, termsAndConditions: false, warranty: true, qrCode: true },
        });
      }
      setProducts([{ id: '1', name: '', price: 0, quantity: 1, gst: 0, amount: 0 }]);
      setReceiptNumber(computeNextReceiptNumber(bizId));
      let loaded = false;
      try {
        const local = localStorage.getItem(`products_${bizId}`);
        if (local) {
          setProductsList(JSON.parse(local));
          loaded = true;
        }
      } catch {}
      if (!loaded) {
        (async () => {
          const { data } = await supabase.from('products').select('*').eq('user_code', bizId);
          if (data) setProductsList(data);
        })();
      }
      (async () => {
        const { data, error } = await supabase.from('customers').select('*').eq('user_code', bizId);
        if (data) setCustomers(data);
      })();
    }
  }, [hasMounted]);

  useEffect(() => {
    if (!hasMounted || !format || !businessInfo) return;
    // Update QR value whenever receipt changes
    const total = products.reduce((sum, p) => sum + p.price * p.quantity * (format && format.columns && format.columns.gst ? (1 + p.gst/100) : 1), 0);
    setQrValue(JSON.stringify({
      receiptNumber,
      businessId: businessInfo.businessId || (businessInfo as any).user_code,
      businessName: businessInfo.name,
      customerId,
      products,
      total,
      date
    }));
  }, [products, customerId, receiptNumber, businessInfo, date, format]);

  useEffect(() => {
    if (!hasMounted || !format || !businessInfo) return;
    // When selectedFormatName changes, always update format
    if (!selectedFormatName || allFormats.length === 0) return;
    const found = allFormats.find(f => f.name === selectedFormatName);
    if (found) setFormat(found.designData);
  }, [selectedFormatName, allFormats]);

  useEffect(() => {
    if (!hasMounted || !format || !businessInfo) return;
    if (saveSuccess && selectedCustomer && selectedCustomer.phone) {
      // Format WhatsApp URL
      const phone = selectedCustomer.phone.replace(/\D/g, '');
      // Compose a short receipt message
      let msg = `Thank you for your purchase!\nReceipt No: ${receiptNumber}`;
      if (selectedCustomer.name) msg += `\nName: ${selectedCustomer.name}`;
      msg += `\nDate: ${date}`;
      msg += `\nTotal: ₹${products.reduce((sum, p) => sum + p.price * p.quantity * (format.columns.gst ? (1 + p.gst/100) : 1), 0).toFixed(2)}`;
      // Use receiptUniqueId for the view link (from last save)
      if (qrValue) {
        msg += `\nView full receipt: ${qrValue}`;
      }
      // Open WhatsApp Web (or app) with prefilled message
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  }, [saveSuccess]);

  useEffect(() => {
    if (!hasMounted) return;
    // On mount, if ?draft=1 and draftToResume in localStorage, load draft into form
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('draft') === '1') {
        const draftStr = localStorage.getItem('draftToResume');
        if (draftStr) {
          try {
            const draft = JSON.parse(draftStr);
            setProducts(draft.products || [{ id: '1', name: '', price: 0, quantity: 1, gst: 0, amount: 0 }]);
            setCustomerId(draft.customerId || '');
            setSelectedCustomer(null); // Optionally fetch customer object
            setFormat(draft.formatDesign || defaultFormat);
            setSelectedFormatName(draft.formatName || '');
            setDate(draft.date || new Date().toISOString().split('T')[0]);
            setWarranty(draft.warranty || '');
            setReturnDays(draft.returnDays || '');
            setReceiptNumber(draft.receiptNumber || '');
          } catch {}
        }
      }
    }
  }, []);

  // --- Receipt Number Serial Logic ---
  function computeNextReceiptNumber(bizId: string): string {
    // Get all receipts and drafts for this business from localStorage
    let serial = 1;
    try {
      const receiptsArr = JSON.parse(localStorage.getItem(`receipts_${bizId}`) || '[]');
      const draftsArr = JSON.parse(localStorage.getItem(`drafts_${bizId}`) || '[]');
      const all = [...receiptsArr, ...draftsArr];
      const serials = all.map((r: any) => {
        const num = (r.receiptNumber || r.receipt_number || '').toString().match(/GR-[^-]+-(\d+)/);
        return num ? parseInt(num[1], 10) : 0;
      });
      serial = Math.max(...serials, 0) + 1;
    } catch {}
    return `GR-${bizId}-${serial}`;
  }

  // Handle customer input (ID only, numeric)
  const handleCustomerIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomerId(value);
    if (value.length > 0) {
      // Search both localStorage and API-fetched customers
      let allCustomers = customers;
      // Merge with localStorage customers if not already merged
      const bizId = localStorage.getItem('businessId') || '';
      try {
        const local = JSON.parse(localStorage.getItem(`customers_${bizId}`) || '[]');
        // Merge by unique customerId or name
        const merged = [...allCustomers];
        local.forEach((lc:any) => {
          if (!merged.find((c:any) => (c.customerId && lc.customerId && c.customerId === lc.customerId) || (c.name && lc.name && c.name === lc.name))) {
            merged.push(lc);
          }
        });
        allCustomers = merged;
      } catch {}
      // Filter by id or name (case-insensitive, partial match)
      const suggestions = allCustomers.filter((c: any) =>
        (c.customerId && c.customerId.toLowerCase().includes(value.toLowerCase())) ||
        (c.name && c.name.toLowerCase().includes(value.toLowerCase()))
      );
      setCustomerSuggestions(suggestions);
      const exact = suggestions.find(
        (c: any) => c.customerId?.toLowerCase() === value.toLowerCase() || c.name?.toLowerCase() === value.toLowerCase()
      );
      setSelectedCustomer(exact || null);
    } else {
      setCustomerSuggestions([]);
      setSelectedCustomer(null);
    }
  };

  const handleSelectCustomerSuggestion = (cust: any) => {
    setCustomerId(cust.customerId || cust.name);
    setCustomerSuggestions([]);
    setSelectedCustomer(cust);
    // Optionally, autofill other customer fields if needed
  };

  const handleNewCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCustomer(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addNewCustomer = async () => {
    setAddingCustomer(true);
    try {
      const { data, error } = await supabase.from('customers').insert([newCustomer]);
      if (error) throw error;
      // Defensive: data may be null or not an array, so check type
      const inserted = Array.isArray(data) ? data[0] : (data ? data : null);
      if (inserted) {
        setCustomers(prev => [...prev, inserted]);
        setCustomerId((inserted as any).customerId || (inserted as any).name);
        setSelectedCustomer(inserted);
      }
      setShowNewCustomer(false);
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        address: '',
        gst: '',
      });
    } catch (error) {
      console.error(error);
    } finally {
      setAddingCustomer(false);
    }
  };

  // Product autofill: Suggestion dropdown and autofill fields
  const handleProductNameChange = (idx: number, value: string) => {
    const updated = [...products];
    updated[idx].name = value;
    setProducts(updated);
    // Show suggestions for product name
    if (value.length > 0) {
      const suggestions = productsList.filter(
        (prod: any) => (prod.productName || prod.name)?.toLowerCase().includes(value.toLowerCase())
      );
      setProductSuggestions(suggestions);
    } else {
      setProductSuggestions([]);
    }
  };

  const handleSelectProductSuggestion = (idx: number, prod: any) => {
    const updated = [...products];
    updated[idx].name = prod.productName || prod.name || '';
    updated[idx].price = prod.price || 0;
    updated[idx].gst = prod.gst || 0;
    updated[idx].quantity = 1;
    setProducts(updated);
    setProductSuggestions([]);
  };

  function handleProductListChange(idx: number, field: keyof Product, value: string | number) {
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  }
  function addProduct() {
    setProducts(prev => [...prev, { id: '', name: '', price: 0, quantity: 1, gst: 0, amount: 0 }]);
  }
  function removeProduct(idx: number) {
    setProducts(prev => prev.filter((_, i) => i !== idx));
  }

  function handleFormatChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const name = e.target.value;
    setSelectedFormatName(name);
    const found = allFormats.find(f => f.name === name);
    if (found) setFormat(found.designData);
  }

  // Replace handleSaveReceipt to save to Supabase
  async function handleSaveReceipt(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    if (!format || !businessInfo) {
      setSaveError('Required business or format info missing. Please reload the page.');
      setSaving(false);
      return;
    }
    const total = products.reduce((sum, p) => sum + p.price * p.quantity * (format.columns.gst ? (1 + p.gst/100) : 1), 0);
    // Generate a unique code for this receipt (for QR and DB lookup)
    const bizId = businessInfo.businessId || (businessInfo as any).user_code || localStorage.getItem('businessId') || localStorage.getItem('user_code') || '';
    if (!bizId) {
      setSaveError('Business ID missing. Please reload the page or log in again.');
      setSaving(false);
      return;
    }
    const receiptUniqueId = `${bizId}_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const receiptData = {
      user_code: bizId,
      receipt_number: receiptNumber,
      customer_id: customerId,
      products: JSON.stringify(products),
      total,
      date,
      terms: businessInfo.terms || '',
      warranty,
      return_days: returnDays,
      format_name: selectedFormatName,
      format_design: JSON.stringify(format),
      qr_code: receiptUniqueId,
      draft: false,
      receipt_id: receiptUniqueId,
    };
    try {
      const { error } = await supabase.from('receipts').insert([receiptData]);
      setSaving(false);
      if (error) setSaveError('Failed to save receipt: ' + error.message);
      else {
        setSaveSuccess(true);
        setQrValue(`${window.location.origin}/view-receipt/${receiptUniqueId}`);
        // --- Increment serial for next receipt ---
        setReceiptNumber(computeNextReceiptNumber(bizId));
      }
    } catch (err: unknown) {
      setSaving(false);
      if (err instanceof Error) setSaveError('Error saving receipt to Supabase: ' + err.message);
      else setSaveError('Unknown error saving receipt to Supabase.');
    }
  }

  function handleSaveDraft() {
    if (!format || !businessInfo) {
      setSaveError('Required business or format info missing. Please reload the page.');
      return;
    }
    const total = products.reduce((sum, p) => sum + p.price * p.quantity * (format.columns.gst ? (1 + p.gst/100) : 1), 0);
    const draftUniqueId = `${businessInfo.businessId || (businessInfo as any).user_code}_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const draftData = {
      businessId: businessInfo.businessId || (businessInfo as any).user_code,
      receiptNumber,
      customerId,
      products,
      total,
      date,
      terms: businessInfo.terms || '',
      warranty,
      returnDays,
      formatName: selectedFormatName,
      formatDesign: format,
      qrCode: draftUniqueId,
      draft: true,
      draftId: draftUniqueId,
    };
    try {
      const allDraftsKey = `drafts_${businessInfo.businessId || (businessInfo as any).user_code}`;
      let allDrafts = [];
      const existing = localStorage.getItem(allDraftsKey);
      if (existing) {
        allDrafts = JSON.parse(existing);
      }
      allDrafts.push(draftData);
      localStorage.setItem(allDraftsKey, JSON.stringify(allDrafts));
      setSaveSuccess(true);
    } catch (err: unknown) {
      setSaveError('Error saving draft: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }

  // Calculate subtotal, gst, total
  const subtotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const gstTotal = format && format.columns && format.columns.gst
    ? products.reduce((sum, p) => sum + (p.price * p.quantity * (p.gst/100)), 0)
    : 0;
  const total = subtotal + gstTotal;

  if (!hasMounted) return null;
  if (!businessInfo || (!businessInfo.businessId && !(businessInfo as any).user_code)) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-50">
        <ServerNavbar isLoggedIn={true} />
        <div className="max-w-2xl mx-auto w-full p-8 text-center">
          <h2 className="text-xl font-bold mb-4 text-red-600">Business info missing</h2>
          <p className="mb-4">Your business profile is not loaded. Please log out and log in again to continue.</p>
          <button onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }} className="btn btn-primary">Log in again</button>
        </div>
        <Footer />
      </main>
    );
  }
  if (!format) return null;

  return (
    <main className="min-h-screen flex flex-col">
      <ServerNavbar isLoggedIn={true} />
      <div className="flex-grow bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold mb-6">Generate Receipt</h1>
          <form className="space-y-6" onSubmit={handleSaveReceipt}>
            <div className="mb-4">
              <label className="block font-medium mb-1">Select Bill Format</label>
              <select value={selectedFormatName} onChange={handleFormatChange} className="border rounded px-3 py-2 w-full">
                {allFormats.length === 0 && <option value="">No formats available</option>}
                {allFormats.map(f => (
                  <option key={f.name} value={f.name}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Receipt Number</label>
                <input type="text" value={receiptNumber} readOnly className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100" />
              </div>
              <div>
                <label className="block font-medium mb-1">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" />
              </div>
            </div>
            <div className="mt-6 mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">Customer Name / ID</label>
                <input
                  type="text"
                  name="customerId"
                  id="customerId"
                  value={customerId}
                  onChange={handleCustomerIdChange}
                  className="input-field"
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowNewCustomer(true)}
                className="bg-primary-100 text-primary-700 px-4 py-2 rounded-md hover:bg-primary-200 transition-colors mt-6 sm:mt-0"
              >
                + New Customer
              </button>
            </div>
            {customerSuggestions.length > 0 && (
              <ul className="absolute bg-white border border-gray-300 rounded shadow z-10 w-full max-h-32 overflow-y-auto">
                {customerSuggestions.map((cust, i) => (
                  <li
                    key={cust.customerId || cust.name || i}
                    className="px-2 py-1 hover:bg-primary-100 cursor-pointer"
                    onClick={() => handleSelectCustomerSuggestion(cust)}
                  >
                    {cust.name} {cust.customerId ? `(${cust.customerId})` : ''}
                  </li>
                ))}
              </ul>
            )}
            {/* Autofill customer details below when selected */}
            {selectedCustomer && (
              <div className="mt-2 text-sm text-gray-700 space-y-1">
                {selectedCustomer.customerId && <div><b>ID:</b> {selectedCustomer.customerId}</div>}
                {selectedCustomer.phone && <div><b>Phone:</b> {selectedCustomer.phone}</div>}
                {selectedCustomer.email && <div><b>Email:</b> {selectedCustomer.email}</div>}
                {selectedCustomer.address && <div><b>Address:</b> {selectedCustomer.address}</div>}
                {selectedCustomer.dob && <div><b>DOB:</b> {selectedCustomer.dob}</div>}
                {selectedCustomer.notes && <div><b>Notes:</b> {selectedCustomer.notes}</div>}
              </div>
            )}
            {showNewCustomer && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                    onClick={() => setShowNewCustomer(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                  <h2 className="text-lg font-semibold mb-4 text-primary-700">Add New Customer</h2>
                  <form
                    onSubmit={e => { e.preventDefault(); addNewCustomer(); }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name<span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="name"
                        value={newCustomer.name}
                        onChange={handleNewCustomerChange}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="text"
                        name="phone"
                        value={newCustomer.phone}
                        onChange={handleNewCustomerChange}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={newCustomer.email}
                        onChange={handleNewCustomerChange}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={newCustomer.address}
                        onChange={handleNewCustomerChange}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">GST</label>
                      <input
                        type="text"
                        name="gst"
                        value={newCustomer.gst}
                        onChange={handleNewCustomerChange}
                        className="input-field"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-primary-500 text-white py-2 rounded-md hover:bg-primary-600 transition-colors"
                      disabled={addingCustomer}
                    >
                      {addingCustomer ? 'Adding...' : 'Add Customer'}
                    </button>
                  </form>
                </div>
              </div>
            )}
            <div>
              <label className="block font-medium mb-1">Products</label>
              <table className="min-w-full border border-gray-300 rounded">
                <thead>
                  <tr>
                    <th className="px-2 py-1">Product</th>
                    <th className="px-2 py-1">Qty</th>
                    {format.columns.gst && <th className="px-2 py-1">GST (%)</th>}
                    <th className="px-2 py-1">Price</th>
                    <th className="px-2 py-1">Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, idx) => (
                    <tr key={idx}>
                      <td className="relative">
                        <input
                          type="text"
                          value={p.name}
                          onChange={e => handleProductNameChange(idx, e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 w-32"
                          required
                          autoComplete="off"
                        />
                        {productSuggestions.length > 0 && (
                          <ul className="absolute bg-white border border-gray-300 rounded shadow z-10 w-full max-h-32 overflow-y-auto">
                            {productSuggestions.map((prod, i) => (
                              <li
                                key={prod.id || i}
                                className="px-2 py-1 hover:bg-primary-100 cursor-pointer"
                                onClick={() => handleSelectProductSuggestion(idx, prod)}
                              >
                                {prod.productName || prod.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td><input type="number" min={1} value={p.quantity} onChange={e => handleProductListChange(idx, 'quantity', Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1 w-16" required /></td>
                      {format.columns.gst && <td><input type="number" min={0} value={p.gst} onChange={e => handleProductListChange(idx, 'gst', Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1 w-16" /></td>}
                      <td><input type="number" min={0} value={p.price} onChange={e => handleProductListChange(idx, 'price', Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1 w-20" required /></td>
                      <td className="text-right">₹{(p.price * p.quantity * (format.columns.gst ? (1 + p.gst/100) : 1)).toFixed(2)}</td>
                      <td><button type="button" onClick={() => removeProduct(idx)} className="text-red-500">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" onClick={addProduct} className="btn-primary mt-2">Add Product</button>
            </div>
            <div className="flex justify-end gap-6 text-right">
              <div>
                <div className="text-sm">Subtotal: <span className="font-semibold">₹{subtotal.toFixed(2)}</span></div>
                {format.columns.gst && <div className="text-sm">GST: <span className="font-semibold">₹{gstTotal.toFixed(2)}</span></div>}
                <div className="text-lg font-bold">Total: ₹{total.toFixed(2)}</div>
              </div>
            </div>
            {format.elements.warranty && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Warranty (days)</label>
                  <input type="number" value={warranty} onChange={e => setWarranty(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block font-medium mb-1">Return Period (days)</label>
                  <input type="number" value={returnDays} onChange={e => setReturnDays(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" />
                </div>
              </div>
            )}
            {format.elements.qrCode && (
              <div className="flex flex-col items-center mt-4">
                <QRCode value={qrValue} size={150} />
                <div className="text-xs text-gray-500 mt-2">Scan to view receipt details</div>
              </div>
            )}
            {businessInfo?.terms && (
              <div className="bg-gray-100 rounded p-3 mt-4 text-xs text-gray-700">
                <strong>Terms & Conditions:</strong> {businessInfo.terms}
              </div>
            )}
            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save & Generate Receipt'}</button>
              <button type="button" className="btn-secondary ml-2" onClick={handleSaveDraft}>Save as Draft</button>
            </div>
            {saveSuccess && <div className="text-green-600 mt-2">Receipt saved successfully!</div>}
            {saveError && <div className="text-red-600 mt-2">{saveError}</div>}
          </form>
        </div>
      </div>
      <Footer />
    </main>
  );
}
