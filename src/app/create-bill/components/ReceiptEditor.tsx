"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ReceiptPreview from './ReceiptPreview';
import QRCode from 'qrcode.react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

// Define interfaces for our data structures
interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  gst: number;
  amount: number;
}

interface ReceiptData {
  receiptNumber: string;
  customerName: string;
  customerPhone: string;
  customerId: string;
  date: string;
  products: Product[];
  subtotal: number;
  gstTotal: number;
  total: number;
  termsAndConditions: string;
  warrantyDays: number;
  returnDays: number;
  businessInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gst: string;
    businessId: string;
  };
}

const ReceiptEditor = () => {
  // State for receipt data
  const [receipt, setReceipt] = useState<ReceiptData>({
    receiptNumber: `GR-${Math.floor(10000 + Math.random() * 90000)}`,
    customerName: '',
    customerPhone: '',
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    products: [
      {
        id: '1',
        name: '',
        price: 0,
        quantity: 1,
        gst: 18,
        amount: 0
      }
    ],
    subtotal: 0,
    gstTotal: 0,
    total: 0,
    termsAndConditions: 'Thank you for your business. All items are subject to our standard return policy.',
    warrantyDays: 30,
    returnDays: 7,
    businessInfo: {
      name: 'Sample Business Ltd.',
      address: '123 Business Street, City, State, PIN',
      phone: '1234567890',
      email: 'business@example.com',
      gst: '27AADCB2230M1ZT',
      businessId: '123456'
    }
  });

  // State for column configuration
  const [columns, setColumns] = useState({
    product: true,
    quantity: true,
    gst: true,
    price: true,
    amount: true
  });

  // State for elements visibility
  const [elements, setElements] = useState({
    logo: true,
    businessInfo: true,
    customerInfo: true,
    termsAndConditions: true,
    warranty: true,
    qrCode: true
  });

  // State for preview mode
  const [showPreview, setShowPreview] = useState(false);
  
  // State for QR Code
  const [qrValue, setQrValue] = useState('');

  // State for new customer modal
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    gst: ''
  });
  const [addingCustomer, setAddingCustomer] = useState(false);

  // State for product import
  const [importingProducts, setImportingProducts] = useState(false);
  const productFileInput = React.createRef<HTMLInputElement>();

  // --- Product options for dropdown ---
  const [productOptions, setProductOptions] = useState<Product[]>([]);

  const router = useRouter();

  // --- Bill Designer Additions ---
  const RECEIPT_TYPES = [
    { label: 'POS (Thermal)', value: 'pos' },
    { label: 'A4 Invoice', value: 'a4' },
    { label: 'Custom Size', value: 'custom' },
    { label: 'Compact', value: 'compact' },
    { label: 'Estimate/Quotation', value: 'estimate' }
  ];
  const LAYOUTS = [
    { label: 'Standard', value: 'standard' },
    { label: 'Compact', value: 'compact' },
    { label: 'Detailed', value: 'detailed' },
    { label: 'Minimal', value: 'minimal' }
  ];
  const FONTS = ['Arial', 'Roboto', 'Courier New', 'Georgia', 'Times New Roman', 'Monospace'];
  const COLORS = [
    { name: 'Default', value: '#1a202c' },
    { name: 'Blue', value: '#2563eb' },
    { name: 'Green', value: '#059669' },
    { name: 'Red', value: '#dc2626' },
    { name: 'Gray', value: '#6b7280' }
  ];

  // --- Bill Designer State ---
  const [receiptType, setReceiptType] = useState('pos');
  const [layout, setLayout] = useState('standard');
  const [font, setFont] = useState('Arial');
  const [color, setColor] = useState('#1a202c');
  const [customWidth, setCustomWidth] = useState(210); // mm for custom
  const [customHeight, setCustomHeight] = useState(297); // mm for custom

  // --- Bill Designer Controls UI ---
  const renderDesignerControls = () => (
    <div className="p-4 bg-white rounded shadow mb-6 flex flex-wrap gap-6 items-center">
      {/* Receipt Type */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Receipt Type</label>
        <select value={receiptType} onChange={e => setReceiptType(e.target.value)} className="input-field">
          {RECEIPT_TYPES.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
        </select>
      </div>
      {/* Layout */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Layout</label>
        <select value={layout} onChange={e => setLayout(e.target.value)} className="input-field">
          {LAYOUTS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>
      {/* Font */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Font</label>
        <select value={font} onChange={e => setFont(e.target.value)} className="input-field">
          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      {/* Color Theme */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Theme Color</label>
        <select value={color} onChange={e => setColor(e.target.value)} className="input-field">
          {COLORS.map(c => <option key={c.value} value={c.value}>{c.name}</option>)}
        </select>
      </div>
      {/* Custom Size for Custom Type */}
      {receiptType === 'custom' && (
        <div className="flex gap-2 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Width (mm)</label>
            <input type="number" value={customWidth} onChange={e => setCustomWidth(Number(e.target.value))} className="input-field w-20" min={50} max={300} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Height (mm)</label>
            <input type="number" value={customHeight} onChange={e => setCustomHeight(Number(e.target.value))} className="input-field w-20" min={50} max={400} />
          </div>
        </div>
      )}
      {/* Column Controls */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Columns</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(columns).map(([col, enabled]) => (
            <label key={col} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => setColumns(c => ({ ...c, [col]: !c[col as keyof typeof c] }))}
              />
              <span className="capitalize">{col}</span>
            </label>
          ))}
        </div>
      </div>
      {/* Elements Controls */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Show/Hide Sections</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(elements).map(([el, enabled]) => (
            <label key={el} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => setElements(e => ({ ...e, [el]: !e[el as keyof typeof e] }))}
              />
              <span className="capitalize">{el.replace(/([A-Z])/g, ' $1')}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  // Load product options from localStorage and then DB (deduplicated)
  useEffect(() => {
    async function fetchProducts() {
      // --- Synchronize businessId and user_code everywhere ---
      let user_code = localStorage.getItem('user_code');
      let businessId = localStorage.getItem('businessId');
      if (user_code && !businessId) {
        localStorage.setItem('businessId', user_code);
        businessId = user_code;
      } else if (!user_code && businessId) {
        localStorage.setItem('user_code', businessId);
        user_code = businessId;
      }
      let localProducts: Product[] = [];
      try {
        const localRaw = localStorage.getItem('products_' + user_code);
        if (localRaw) localProducts = JSON.parse(localRaw);
      } catch {}
      setProductOptions(localProducts);
      // Only fetch from DB if local is empty
      if (!localProducts.length) {
        const { data: dbProducts, error } = await supabase.from('products').select('*').eq('user_code', user_code);
        if (dbProducts && dbProducts.length) {
          // Deduplicate by name (case-insensitive)
          const localNames = new Set(localProducts.map(p => p.name.trim().toLowerCase()));
          const uniqueDbProducts = dbProducts.filter((p: Product) => !localNames.has(p.name.trim().toLowerCase()));
          setProductOptions([...localProducts, ...uniqueDbProducts]);
        }
      }
    }
    fetchProducts();
  }, []);

  // Calculate totals whenever products change
  useEffect(() => {
    const calculatedProducts = receipt.products.map(product => ({
      ...product,
      amount: product.price * product.quantity * (1 + product.gst / 100)
    }));
    
    const subtotal = calculatedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    const gstTotal = calculatedProducts.reduce((sum, product) => sum + (product.price * product.quantity * (product.gst / 100)), 0);
    const total = subtotal + gstTotal;
    
    setReceipt(prev => ({
      ...prev,
      products: calculatedProducts,
      subtotal,
      gstTotal,
      total
    }));
    
    // Generate QR code value (JSON of receipt data)
    setQrValue(JSON.stringify({
      receipt: receipt.receiptNumber,
      business: receipt.businessInfo.name,
      businessId: receipt.businessInfo.businessId,
      customer: receipt.customerName,
      total: total.toFixed(2),
      date: receipt.date
    }));
  }, [receipt.products, receipt.customerName, receipt.date]);

  // Handle input change for receipt fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties like businessInfo.name
      const [parent, child] = name.split('.');
      setReceipt(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      // Handle top-level properties
      setReceipt(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle product change
  const handleProductChange = (index: number, field: keyof Product, value: string | number) => {
    const updatedProducts = [...receipt.products];
    
    // Convert string values to numbers for numerical fields
    if (field === 'price' || field === 'quantity' || field === 'gst') {
      updatedProducts[index][field] = typeof value === 'string' ? parseFloat(value) || 0 : value;
    } else {
      (updatedProducts[index] as any)[field] = value;
    }
    
    setReceipt(prev => ({
      ...prev,
      products: updatedProducts
    }));
  };

  // Add a new product row
  const addProduct = () => {
    setReceipt(prev => ({
      ...prev,
      products: [
        ...prev.products,
        {
          id: `${prev.products.length + 1}`,
          name: '',
          price: 0,
          quantity: 1,
          gst: 18,
          amount: 0
        }
      ]
    }));
  };

  // Remove a product row
  const removeProduct = (index: number) => {
    if (receipt.products.length > 1) {
      const updatedProducts = [...receipt.products];
      updatedProducts.splice(index, 1);
      
      setReceipt(prev => ({
        ...prev,
        products: updatedProducts
      }));
    }
  };

  // Toggle column visibility
  const toggleColumn = (column: keyof typeof columns) => {
    setColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  // Toggle element visibility
  const toggleElement = (element: keyof typeof elements) => {
    setElements(prev => ({
      ...prev,
      [element]: !prev[element]
    }));
  };

  // Handle saving the receipt
  const saveReceipt = async () => {
    // In a real app, this would save to the database
    alert('Receipt saved successfully!');
    // Here you would typically make an API call to save the receipt
    // After saving, if customerPhone is present, open WhatsApp and redirect to dashboard
    if (receipt.customerPhone) {
      const url = `https://wa.me/${receipt.customerPhone.replace(/\D/g,'')}?text=Thank you for your purchase! Your receipt number is ${receipt.receiptNumber}.`;
      window.open(url, '_blank');
    }
    router.replace('/dashboard');
  };

  // Handle saving as draft
  const saveAsDraft = () => {
    // In a real app, this would save to localStorage or database as a draft
    localStorage.setItem('receiptDraft', JSON.stringify(receipt));
    alert('Receipt saved as draft!');
  };
  
  // Handle new customer input
  function handleNewCustomerChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNewCustomer(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  // Handle saving new customer
  async function addNewCustomer() {
    if (!newCustomer.name) return alert('Name is required');
    setAddingCustomer(true);
    // Save to Supabase
    const user_code = typeof window !== 'undefined' ? localStorage.getItem('user_code') : '';
    const { data, error } = await supabase.from('customers').insert([{ ...newCustomer, user_code }]).select();
    setAddingCustomer(false);
    if (error) return alert('Failed to save customer');
    // Save to localStorage
    if (typeof window !== 'undefined') {
      const prev = localStorage.getItem('customers_' + user_code);
      let arr = [];
      try { arr = prev ? JSON.parse(prev) : []; } catch {}
      arr.push(data[0]);
      localStorage.setItem('customers_' + user_code, JSON.stringify(arr));
    }
    setReceipt(prev => ({ ...prev, customerName: newCustomer.name, customerPhone: newCustomer.phone, customerId: data[0].id }));
    setShowNewCustomer(false);
    setNewCustomer({ name: '', phone: '', address: '', email: '', gst: '' });
  }

  // Handle importing products
  const handleImportProducts = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!productFileInput.current || !productFileInput.current.files) return;
    setImportingProducts(true);
    const file = productFileInput.current.files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (!event.target?.result) return;
      const csvData = event.target.result as string;
      const products = csvData.split('\n').map((row) => {
        const [name, price, quantity, gst] = row.split(',');
        return {
          id: `${receipt.products.length + 1}`,
          name,
          price: parseFloat(price) || 0,
          quantity: parseInt(quantity) || 1,
          gst: parseFloat(gst) || 0,
          amount: 0
        };
      });
      setReceipt(prev => ({
        ...prev,
        products: [...prev.products, ...products]
      }));
      setImportingProducts(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {renderDesignerControls()}
      {!showPreview ? (
        <div className="p-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Receipt Details</h2>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="bg-primary-100 text-primary-700 px-4 py-2 rounded-md hover:bg-primary-200 transition-colors"
              >
                Preview Receipt
              </button>
              <button
                type="button"
                onClick={saveAsDraft}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={saveReceipt}
                className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
              >
                Save Receipt
              </button>
            </div>
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Receipt Elements</h3>
            <div className="flex flex-wrap gap-4 mb-6">
              {Object.entries(elements).map(([key, value]) => (
                <div key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`element-${key}`}
                    checked={value}
                    onChange={() => toggleElement(key as keyof typeof elements)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`element-${key}`} className="ml-2 text-sm text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {elements.businessInfo && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="businessInfo.name" className="block text-sm font-medium text-gray-700">
                    Business Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="businessInfo.name"
                      id="businessInfo.name"
                      value={receipt.businessInfo.name}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="businessInfo.gst" className="block text-sm font-medium text-gray-700">
                    GST Number
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="businessInfo.gst"
                      id="businessInfo.gst"
                      value={receipt.businessInfo.gst}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-6">
                  <label htmlFor="businessInfo.address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="businessInfo.address"
                      id="businessInfo.address"
                      value={receipt.businessInfo.address}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="businessInfo.phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="businessInfo.phone"
                      id="businessInfo.phone"
                      value={receipt.businessInfo.phone}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="businessInfo.email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="businessInfo.email"
                      id="businessInfo.email"
                      value={receipt.businessInfo.email}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {elements.customerInfo && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">Customer ID</label>
                  <input
                    type="text"
                    name="customerId"
                    id="customerId"
                    value={receipt.customerId}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter customer ID or leave blank"
                  />
                  <button
                    type="button"
                    className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                    onClick={() => setShowNewCustomer(true)}
                  >
                    New Customer
                  </button>
                </div>
                <div className="sm:col-span-3">
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Customer Name</label>
                  <input
                    type="text"
                    name="customerName"
                    id="customerName"
                    value={receipt.customerName}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Customer name"
                    required
                  />
                </div>
                <div className="sm:col-span-3">
                  <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700">Customer Phone</label>
                  <input
                    type="text"
                    name="customerPhone"
                    id="customerPhone"
                    value={receipt.customerPhone}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    name="date"
                    id="date"
                    value={receipt.date}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
              </div>
              {showNewCustomer && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                  <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-4">Add New Customer</h3>
                    <div className="space-y-3">
                      <input name="name" value={newCustomer.name} onChange={handleNewCustomerChange} placeholder="Name (required)" className="w-full border px-3 py-2 rounded" required />
                      <input name="phone" value={newCustomer.phone} onChange={handleNewCustomerChange} placeholder="Phone" className="w-full border px-3 py-2 rounded" />
                      <input name="address" value={newCustomer.address} onChange={handleNewCustomerChange} placeholder="Address" className="w-full border px-3 py-2 rounded" />
                      <input name="email" value={newCustomer.email} onChange={handleNewCustomerChange} placeholder="Email" className="w-full border px-3 py-2 rounded" />
                      <input name="gst" value={newCustomer.gst} onChange={handleNewCustomerChange} placeholder="GST" className="w-full border px-3 py-2 rounded" />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button onClick={()=>setShowNewCustomer(false)} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
                      <button onClick={addNewCustomer} className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600" disabled={addingCustomer}>{addingCustomer ? 'Adding...' : 'Add Customer'}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Import Products (CSV)</label>
            <form onSubmit={handleImportProducts} className="flex items-center gap-2">
              <input
                type="file"
                ref={productFileInput}
                accept=".csv"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-4 py-2 rounded-full transition-colors shadow"
                disabled={importingProducts}
              >
                {importingProducts ? 'Importing...' : 'Import'}
              </button>
            </form>
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Products</h3>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={addProduct}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
                >
                  Add Product
                </button>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  onClick={() => {
                    document.getElementById('columnsDropdown')?.classList.toggle('hidden');
                  }}
                >
                  Customize Columns
                </button>
                <div id="columnsDropdown" className="absolute right-0 mt-10 w-48 bg-white shadow-lg rounded-md hidden z-10">
                  <div className="p-2">
                    {Object.entries(columns).map(([key, value]) => (
                      <div key={key} className="flex items-center p-2">
                        <input
                          type="checkbox"
                          id={`column-${key}`}
                          checked={value}
                          onChange={() => toggleColumn(key as keyof typeof columns)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`column-${key}`} className="ml-2 text-sm text-gray-700 capitalize">
                          {key}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    {columns.product && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                    )}
                    {columns.quantity && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                    )}
                    {columns.price && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                    )}
                    {columns.gst && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GST %
                      </th>
                    )}
                    {columns.amount && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    )}
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {receipt.products.map((product, index) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      {columns.product && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            list={`product-list-${index}`}
                            value={product.name}
                            onChange={e => {
                              const selected = productOptions.find(opt => opt.name === e.target.value);
                              if (selected) {
                                handleProductChange(index, 'name', selected.name);
                                handleProductChange(index, 'price', selected.price);
                                handleProductChange(index, 'gst', selected.gst);
                              } else {
                                handleProductChange(index, 'name', e.target.value);
                              }
                            }}
                            className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm"
                            placeholder="Enter or select product name"
                          />
                          <datalist id={`product-list-${index}`}>
                            {productOptions.map(opt => (
                              <option key={opt.id} value={opt.name} />
                            ))}
                          </datalist>
                        </td>
                      )}
                      {columns.quantity && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={product.quantity}
                            min="1"
                            onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                            className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm"
                          />
                        </td>
                      )}
                      {columns.price && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={product.price}
                            min="0"
                            step="0.01"
                            onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                            className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm"
                          />
                        </td>
                      )}
                      {columns.gst && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={product.gst}
                            min="0"
                            step="0.01"
                            onChange={(e) => handleProductChange(index, 'gst', e.target.value)}
                            className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm"
                          />
                        </td>
                      )}
                      {columns.amount && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{product.amount.toFixed(2)}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => removeProduct(index)}
                          className="text-red-600 hover:text-red-900"
                          disabled={receipt.products.length === 1}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  <tr>
                    <td colSpan={columns.product ? 2 : 1} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      Subtotal:
                    </td>
                    <td colSpan={columns.quantity ? 1 : 0} className="px-6 py-4"></td>
                    <td colSpan={columns.price ? 1 : 0} className="px-6 py-4"></td>
                    <td colSpan={columns.gst ? 1 : 0} className="px-6 py-4"></td>
                    <td colSpan={(columns.amount ? 1 : 0) + 1} className="px-6 py-4 text-sm text-gray-900">
                      ₹{receipt.subtotal.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={columns.product ? 2 : 1} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      GST:
                    </td>
                    <td colSpan={columns.quantity ? 1 : 0} className="px-6 py-4"></td>
                    <td colSpan={columns.price ? 1 : 0} className="px-6 py-4"></td>
                    <td colSpan={columns.gst ? 1 : 0} className="px-6 py-4"></td>
                    <td colSpan={(columns.amount ? 1 : 0) + 1} className="px-6 py-4 text-sm text-gray-900">
                      ₹{receipt.gstTotal.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={columns.product ? 2 : 1} className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                      Total:
                    </td>
                    <td colSpan={columns.quantity ? 1 : 0} className="px-6 py-4"></td>
                    <td colSpan={columns.price ? 1 : 0} className="px-6 py-4"></td>
                    <td colSpan={columns.gst ? 1 : 0} className="px-6 py-4"></td>
                    <td colSpan={(columns.amount ? 1 : 0) + 1} className="px-6 py-4 text-lg font-bold text-gray-900">
                      ₹{receipt.total.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {elements.termsAndConditions && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Terms and Conditions</h3>
              <div>
                <label htmlFor="termsAndConditions" className="sr-only">Terms and Conditions</label>
                <textarea
                  id="termsAndConditions"
                  name="termsAndConditions"
                  rows={3}
                  value={receipt.termsAndConditions}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
            </div>
          )}
          
          {elements.warranty && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Warranty & Return Policy</h3>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="warrantyDays" className="block text-sm font-medium text-gray-700">
                    Warranty Period (days)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="warrantyDays"
                      id="warrantyDays"
                      min="0"
                      value={receipt.warrantyDays}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="returnDays" className="block text-sm font-medium text-gray-700">
                    Return Period (days)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="returnDays"
                      id="returnDays"
                      min="0"
                      value={receipt.returnDays}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {elements.qrCode && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">QR Code Preview</h3>
              <div className="flex justify-center">
                <div className="p-4 bg-white border border-gray-200 rounded-md">
                  <QRCode value={qrValue} size={150} />
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500 text-center">
                This QR code will be included in the receipt and can be scanned by customers.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div
          className={showPreview ? "bg-white shadow rounded-lg p-6" : ""}
          style={{
            fontFamily: font,
            color: color,
            maxWidth:
              receiptType === 'a4' ? 900 :
              receiptType === 'pos' ? 380 :
              receiptType === 'compact' ? 300 :
              receiptType === 'custom' ? customWidth * 3.78 : 700,
            minHeight:
              receiptType === 'a4' ? 1200 :
              receiptType === 'pos' ? 600 :
              receiptType === 'compact' ? 400 :
              receiptType === 'custom' ? customHeight * 3.78 : 600,
            background: '#fff',
            border: '1px solid #e5e7eb',
            margin: '0 auto',
            transition: 'all 0.3s',
          }}
        >
          <ReceiptPreview 
            receipt={receipt} 
            elements={elements} 
            columns={columns} 
          />
          <div className="p-6 bg-gray-50 flex justify-between">
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Edit Receipt
            </button>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-primary-100 text-primary-700 px-4 py-2 rounded-md hover:bg-primary-200 transition-colors"
              >
                Print Receipt
              </button>
              <button
                type="button"
                onClick={saveReceipt}
                className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
              >
                Save Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptEditor; 