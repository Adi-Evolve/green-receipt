'use client';

import React from 'react';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabaseClient';

const PRODUCT_TYPES = [
  {
    type: 'general',
    label: 'General Store Product',
    fields: [
      { key: 'companyName', label: 'Company Name' },
      { key: 'productName', label: 'Product Name' },
      { key: 'price', label: 'Price' },
      { key: 'mrp', label: 'MRP' },
      { key: 'gst', label: 'GST (%)' },
    ],
  },
  {
    type: 'footwear',
    label: 'Footwear',
    fields: [
      { key: 'companyName', label: 'Company Name' },
      { key: 'productName', label: 'Product Name' },
      { key: 'size', label: 'Size' },
      { key: 'price', label: 'Price' },
      { key: 'mrp', label: 'MRP' },
      { key: 'gst', label: 'GST (%)' },
    ],
  },
  {
    type: 'food',
    label: 'Food Product',
    fields: [
      { key: 'companyName', label: 'Company Name' },
      { key: 'productName', label: 'Product Name' },
      { key: 'expiry', label: 'Expiry Date' },
      { key: 'price', label: 'Price' },
      { key: 'mrp', label: 'MRP' },
      { key: 'gst', label: 'GST (%)' },
    ],
  },
  {
    type: 'optical',
    label: 'Optical Product',
    fields: [
      { key: 'companyName', label: 'Company Name' },
      { key: 'productName', label: 'Product Name' },
      { key: 'lensNumber', label: 'Lens Number' },
      { key: 'price', label: 'Price' },
      { key: 'mrp', label: 'MRP' },
      { key: 'gst', label: 'GST (%)' },
    ],
  },
  {
    type: 'electronics',
    label: 'Electronics',
    fields: [
      { key: 'brand', label: 'Brand' },
      { key: 'model', label: 'Model' },
      { key: 'serialNumber', label: 'Serial Number' },
      { key: 'warranty', label: 'Warranty (months)' },
      { key: 'price', label: 'Price' },
      { key: 'mrp', label: 'MRP' },
      { key: 'gst', label: 'GST (%)' },
    ],
  },
  {
    type: 'pharmacy',
    label: 'Pharmacy/Medicine',
    fields: [
      { key: 'brand', label: 'Brand' },
      { key: 'medicineName', label: 'Medicine Name' },
      { key: 'batchNumber', label: 'Batch Number' },
      { key: 'expiry', label: 'Expiry Date' },
      { key: 'price', label: 'Price' },
      { key: 'mrp', label: 'MRP' },
      { key: 'gst', label: 'GST (%)' },
    ],
  },
  {
    type: 'apparel',
    label: 'Apparel/Clothing',
    fields: [
      { key: 'brand', label: 'Brand' },
      { key: 'productName', label: 'Product Name' },
      { key: 'size', label: 'Size' },
      { key: 'color', label: 'Color' },
      { key: 'price', label: 'Price' },
      { key: 'mrp', label: 'MRP' },
      { key: 'gst', label: 'GST (%)' },
    ],
  },
  {
    type: 'stationery',
    label: 'Stationery',
    fields: [
      { key: 'brand', label: 'Brand' },
      { key: 'productName', label: 'Product Name' },
      { key: 'price', label: 'Price' },
      { key: 'mrp', label: 'MRP' },
      { key: 'gst', label: 'GST (%)' },
    ],
  },
  {
    type: 'grocery',
    label: 'Grocery',
    fields: [
      { key: 'brand', label: 'Brand' },
      { key: 'productName', label: 'Product Name' },
      { key: 'weight', label: 'Weight/Volume' },
      { key: 'expiry', label: 'Expiry Date' },
      { key: 'price', label: 'Price' },
      { key: 'mrp', label: 'MRP' },
      { key: 'gst', label: 'GST (%)' },
    ],
  },
  {
    type: 'hardware',
    label: 'Hardware/Tools',
    fields: [
      { key: 'brand', label: 'Brand' },
      { key: 'productName', label: 'Product Name' },
      { key: 'model', label: 'Model' },
      { key: 'price', label: 'Price' },
      { key: 'mrp', label: 'MRP' },
      { key: 'gst', label: 'GST (%)' },
    ],
  },
  {
    type: 'books',
    label: 'Books',
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'author', label: 'Author' },
      { key: 'isbn', label: 'ISBN' },
      { key: 'price', label: 'Price' },
      { key: 'mrp', label: 'MRP' },
      { key: 'gst', label: 'GST (%)' },
    ],
  },
  {
    type: 'restaurant',
    label: 'Restaurant',
    fields: [
      { key: 'dishName', label: 'Dish Name' },
      { key: 'category', label: 'Category' },
      { key: 'price', label: 'Price' },
      { key: 'mrp', label: 'MRP' },
      { key: 'gst', label: 'GST (%)' },
    ],
  },
];

function getSavedFormats(businessId: string) {
  if (!businessId) return [];
  const raw = localStorage.getItem(`product_formats_${businessId}`);
  if (raw) try { return JSON.parse(raw); } catch {};
  return [];
}
function saveFormat(businessId: string, format: any) {
  const formats = getSavedFormats(businessId);
  formats.push(format);
  localStorage.setItem(`product_formats_${businessId}`, JSON.stringify(formats));
}

export default function AddProductPage() {
  const [step, setStep] = React.useState(2); 
  const [businessId, setBusinessId] = React.useState('');
  const [forceFormat, setForceFormat] = React.useState(false); 
  React.useEffect(() => {
    const id = localStorage.getItem('businessId') || '';
    setBusinessId(id);
    const formats = id ? getSavedFormats(id) : [];
    if (!formats.length) {
      setStep(1);
    } else {
      setStep(2);
    }
  }, []);

  const [selectedType, setSelectedType] = React.useState('general');
  const [selectedFields, setSelectedFields] = React.useState<string[]>(PRODUCT_TYPES[0].fields.map(f=>f.key));
  const [formatName, setFormatName] = React.useState('');
  const formats = businessId ? getSavedFormats(businessId) : [];

  const [chosenFormat, setChosenFormat] = React.useState<any>(null);
  const [productForm, setProductForm] = React.useState<any>({});
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string|null>(null);

  React.useEffect(() => {
    const typeObj = PRODUCT_TYPES.find(t => t.type === selectedType);
    setSelectedFields(typeObj ? typeObj.fields.map(f=>f.key) : []);
  }, [selectedType]);

  React.useEffect(() => {
    if (!forceFormat && formats.length && step === 1) {
      setStep(2);
    }
  }, [formats.length, forceFormat]);

  const handleCreateNewFormat = () => {
    setForceFormat(true);
    setStep(1);
  };

  const handleImportProducts = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      await supabase.from('products').upsert(imported);
      let arr = [];
      try { arr = JSON.parse(localStorage.getItem(`products_${businessId}`) || '[]'); } catch {}
      arr = arr.concat(imported);
      localStorage.setItem(`products_${businessId}`, JSON.stringify(arr));
      setSuccess(true);
    };
    reader.readAsText(file);
  };

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <ServerNavbar isLoggedIn={true} />
      <div className="flex-grow max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-primary-800 mb-6">Add Product</h1>
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${step===1?'bg-primary-600 text-white':'bg-gray-200'}`}>1. Create Format</span>
            <span className="text-gray-400">→</span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${step===2?'bg-primary-600 text-white':'bg-gray-200'}`}>2. Add Product</span>
          </div>
          {step === 2 && formats.length > 0 && (
            <div className="flex justify-end mb-2">
              <button className="btn-secondary" onClick={handleCreateNewFormat}>+ Create New Format</button>
            </div>
          )}
          {step === 1 && (
            <div className="bg-white rounded shadow p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                <select className="w-full border rounded p-2" value={selectedType} onChange={e=>setSelectedType(e.target.value)}>
                  {PRODUCT_TYPES.map(t=>(<option key={t.type} value={t.type}>{t.label}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fields to include</label>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_TYPES.find(t=>t.type===selectedType)?.fields.map(f=>(
                    <label key={f.key} className="flex items-center gap-1">
                      <input type="checkbox" checked={selectedFields.includes(f.key)} onChange={e=>{
                        if(e.target.checked) setSelectedFields([...selectedFields,f.key]);
                        else setSelectedFields(selectedFields.filter(k=>k!==f.key));
                      }} />
                      <span>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format Name</label>
                <input className="w-full border rounded p-2" value={formatName} onChange={e=>setFormatName(e.target.value)} placeholder="e.g. My Footwear Format" />
              </div>
              <button className="btn-primary mt-2" disabled={!formatName||!selectedFields.length} onClick={() => {
                saveFormat(businessId, {type:selectedType,fields:selectedFields,name:formatName});
                setFormatName('');
                setForceFormat(false);
                setStep(2);
              }}>Save Format & Continue</button>
            </div>
          )}
          {step === 2 && (
            <div className="bg-white rounded shadow p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Choose Format</label>
                <select className="w-full border rounded p-2 mb-4" value={chosenFormat?.name||''} onChange={e=>{
                  const f = formats.find((f: { name: string }) => f.name === e.target.value);
                  setChosenFormat(f);
                  setProductForm({});
                }}>
                  <option value="">Select a format...</option>
                  {formats.map((f: { name: string }) => (<option key={f.name} value={f.name}>{f.name}</option>))}
                </select>
              </div>
              {chosenFormat && (
                <form className="space-y-4" onSubmit={async e => {
                  e.preventDefault();
                  setError(null);
                  setSuccess(false);
                  if (!businessId) { setError('Business profile not found.'); return; }
                  const product = { ...productForm, type: chosenFormat.type, format: chosenFormat.name, user_code: businessId };
                  try {
                    const { error } = await supabase.from('products').upsert([product]);
                    if (error) {
                      setError('Failed to save to Supabase: ' + error.message);
                      return;
                    }
                    setSuccess(true);
                    setProductForm({});
                    // Refresh local list from Supabase
                    const { data } = await supabase.from('products').select('*').eq('user_code', businessId);
                    if (data) localStorage.setItem(`products_${businessId}`, JSON.stringify(data));
                    // Also update localStorage directly (for instant cache)
                    let arr = [];
                    try { arr = JSON.parse(localStorage.getItem(`products_${businessId}`) || '[]'); } catch {}
                    arr.push(product);
                    localStorage.setItem(`products_${businessId}`, JSON.stringify(arr));
                  } catch (err: unknown) {
                    if (err instanceof Error) {
                      setError('Unexpected error: ' + err.message);
                    } else {
                      setError('Unexpected error occurred.');
                    }
                  }
                }}>
                  {chosenFormat.fields.map((key:string)=>(
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700">{PRODUCT_TYPES.find(t=>t.type===chosenFormat.type)?.fields.find(f=>f.key===key)?.label||key}</label>
                      <input
                        type={key==='price'||key==='mrp'||key==='gst'?'number':key==='expiry'?'date':'text'}
                        name={key}
                        value={productForm[key]||''}
                        onChange={e=>setProductForm((prev:any)=>({...prev,[key]:e.target.value}))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-600 focus:border-primary-600"
                        required
                      />
                    </div>
                  ))}
                  <button type="submit" className="btn-primary w-full">Add Product</button>
                  {success && <div className="text-green-600 mt-2">Product added!</div>}
                  {error && <div className="text-red-600 mt-2">{error}</div>}
                </form>
              )}
            </div>
          )}
          <input type="file" accept=".csv,.xlsx" onChange={handleImportProducts} className="mb-2" />
          <span className="text-xs text-gray-500">Import CSV/Excel (Tally, etc)</span>
        </div>
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Your Products</h2>
          <ProductList businessId={businessId} />
        </div>
      </div>
      <Footer />
    </main>
  );
}

function ProductList({ businessId }: { businessId: string }) {
  const [products, setProducts] = React.useState<any[]>([]);
  React.useEffect(() => {
    if (!businessId) return;
    // Fetch products from Supabase
    (async () => {
      const { data } = await supabase.from('products').select('*').eq('user_code', businessId);
      if (data) setProducts(data);
    })();
  }, [businessId]);
  if (!products.length) return <div className="text-gray-500 text-sm">No products yet.</div>;
  return (
    <ul className="divide-y divide-gray-200">
      {products.map((p: any, idx:number) => (
        <li key={idx} className="py-2 flex justify-between text-sm">
          <span>{p.productName||p.name}</span>
          <span className="text-gray-600">₹{p.price}</span>
          <span className="text-gray-400">{p.format}</span>
        </li>
      ))}
    </ul>
  );
}
