"use client";

import React, { useEffect, useState } from 'react';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import ColumnManager from './components/ColumnManager';
import ElementToggles from './components/ElementToggles';
import ReceiptFullPreview from './components/ReceiptFullPreview';

// --- Type Definitions for Bill Formats ---
interface BillDesign {
  name: string;
  designData: Record<string, any>; // More specific typing can be added if needed
  _id?: string;
}

const DEFAULT_FORMAT: BillDesign = {
  name: 'Default',
  designData: {
    columns: {
      product: true,
      quantity: true,
      gst: true,
      price: true,
      amount: true,
      serial: false,
      discount: false
    },
    elements: {
      logo: true,
      businessInfo: true,
      customerInfo: true,
      termsAndConditions: true,
      warranty: false,
      returnPeriod: false,
      qrCode: true,
      signature: false,
      notes: false
    },
    font: 'Arial',
    color: '#000000',
    layout: 'default',
    showBorder: true,
    showGrid: false,
    preview: false
  }
};

function getDefaultFormatName(existing: string[]): string {
  let idx = 1;
  while (existing.includes(`Format ${idx}`)) idx++;
  return `Format ${idx}`;
}

export default function CreateBillDesignPage() {
  const router = useRouter();
  const [formats, setFormats] = useState<BillDesign[]>([]); // all formats
  const [selectedIdx, setSelectedIdx] = useState(0); // index of selected tab
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string|null>(null);
  const [businessId, setBusinessId] = useState('');
  const [renamingIdx, setRenamingIdx] = useState<number|null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [signatureImg, setSignatureImg] = useState<string | null>(null);

  useEffect(() => {
    let biz = localStorage.getItem('businessInfo');
    let info;
    if (biz) {
      try {
        info = JSON.parse(biz);
      } catch {
        info = null;
      }
    }
    if (!info || !info.businessId) {
      // Set a default businessId if missing
      info = { businessId: 'DEFAULT_BIZ_ID' };
      localStorage.setItem('businessInfo', JSON.stringify(info));
    }
    setBusinessId(info.businessId);
    // Load formats from localStorage here:
    const saved = localStorage.getItem(`billDesigns_${info.businessId}`);
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) setFormats(arr);
      } catch {}
    }
    setLoading(false);
  }, []);

  function handleToggle(section: 'columns'|'elements', key: string) {
    setFormats(prev => prev.map((f, i) =>
      i === selectedIdx ? { ...f, designData: { ...f.designData, [section]: { ...f.designData[section], [key]: !f.designData[section][key] } } } : f
    ));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;
    const checked = (type === 'checkbox' && 'checked' in target) ? (target as HTMLInputElement).checked : undefined;
    setFormats(prev => prev.map((f, i) =>
      i === selectedIdx ? { ...f, designData: { ...f.designData, [name]: type === 'checkbox' ? checked : value } } : f
    ));
  }

  function handlePreview() {
    setFormats(prev => prev.map((f, i) =>
      i === selectedIdx ? { ...f, designData: { ...f.designData, preview: !f.designData.preview } } : f
    ));
  }

  function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      let id = businessId;
      if (!id) {
        // Fallback: set default businessId if missing
        id = 'DEFAULT_BIZ_ID';
        setBusinessId(id);
        localStorage.setItem('businessInfo', JSON.stringify({ businessId: id }));
      }
      let toSave = formats;
      if (!toSave || toSave.length === 0) {
        toSave = [{ ...DEFAULT_FORMAT }];
        setFormats(toSave);
      }
      localStorage.setItem(`billDesigns_${id}`, JSON.stringify(toSave));
      setSaveError('Saved locally!');
    } catch (err: any) {
      setSaveError('Failed to save locally.');
    } finally {
      setSaving(false);
    }
  }

  function handleCreateNew() {
    const names = formats.map(f => f.name);
    const newName = getDefaultFormatName(names);
    setFormats(prev => [...prev, { name: newName, designData: { ...DEFAULT_FORMAT.designData } }]);
    setSelectedIdx(formats.length);
  }

  function handleRename(idx: number) {
    setRenamingIdx(idx);
    setRenameValue(formats[idx].name);
  }

  function handleRenameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRenameValue(e.target.value);
  }

  function handleRenameSave(idx: number) {
    const updated = [...formats];
    updated[idx].name = renameValue.trim() || updated[idx].name;
    setFormats(updated);
    setRenamingIdx(null);
    // Save to localStorage
    localStorage.setItem(`billDesigns_${businessId}`, JSON.stringify(updated));
  }

  function handleSignatureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setSignatureImg(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  // Defensive helper to safely get columns object
  function getColumns(format: BillDesign | undefined): Record<string, boolean> {
    return format && format.designData && format.designData.columns ? format.designData.columns as Record<string, boolean> : {};
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-0 px-0">
      <ServerNavbar />
      <div className="flex flex-col md:flex-row gap-0 w-full">
        {/* Format Management Sidebar */}
        <div className="w-full md:w-60 bg-white border-r border-gray-200 px-4 py-6 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-gray-800 text-lg">Formats</span>
            <button
              className="bg-gray-600 hover:bg-gray-700 text-white rounded-full w-8 h-8 flex items-center justify-center shadow"
              title="Add Format"
              onClick={() => {
                const names = formats.map(f => f.name);
                const newName = getDefaultFormatName(names);
                setFormats(prev => [...prev, { ...DEFAULT_FORMAT, name: newName }]);
                setSelectedIdx(formats.length);
              }}
            >
              +
            </button>
          </div>
          <ul className="flex flex-col gap-1">
            {formats.map((f, i) => (
              <li key={i} className={`flex items-center group rounded-lg px-2 py-1 cursor-pointer ${selectedIdx === i ? 'bg-gray-200 text-gray-900 font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}
                  onClick={() => setSelectedIdx(i)}>
                {renamingIdx === i ? (
                  <input
                    className="rounded border px-2 py-1 text-sm w-28 mr-2"
                    value={renameValue}
                    autoFocus
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={() => { setRenamingIdx(null); setRenameValue(''); }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        setFormats(prev => prev.map((fmt, idx) => idx === i ? { ...fmt, name: renameValue.trim() || fmt.name } : fmt));
                        setRenamingIdx(null); setRenameValue('');
                      }
                    }}
                  />
                ) : (
                  <span className="truncate flex-1">{f.name}</span>
                )}
                <button className="ml-1 text-gray-700 hover:text-gray-900 p-1 rounded hover:bg-gray-200" title="Rename"
                  onClick={e => { e.stopPropagation(); setRenamingIdx(i); setRenameValue(f.name); }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97l-9.193 9.193a4.2 4.2 0 0 1-1.768 1.05l-3.012.86.86-3.012a4.2 4.2 0 0 1 1.05-1.768l9.193-9.193Z" />
                  </svg>
                </button>
                <button className="ml-1 text-red-600 hover:text-white hover:bg-red-600 p-1 rounded" title="Delete"
                  onClick={e => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this format?')) {
                      setFormats(prev => prev.filter((_, idx) => idx !== i));
                      if (selectedIdx === i) setSelectedIdx(0);
                    }
                  }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* Main Bill Design Content */}
        <div className="flex-1 px-6 py-8 relative">
          <div className="flex flex-col md:flex-row gap-10">
            <div className="flex-1 space-y-6">
              {/* Column Manager */}
              <div className="mb-4">
                <h2 className="font-semibold mb-2 text-gray-800">Table Columns</h2>
                <ColumnManager
                  columns={formats[selectedIdx].designData.columns}
                  setColumns={cols => setFormats(prev => prev.map((f, i) => i === selectedIdx ? { ...f, designData: { ...f.designData, columns: cols } } : f))}
                />
              </div>
              {/* Element Toggles */}
              <div className="mb-4">
                <h2 className="font-semibold mb-2 text-gray-800">Receipt Elements</h2>
                <ElementToggles
                  elements={formats[selectedIdx].designData.elements}
                  setElements={els => setFormats(prev => prev.map((f, i) => i === selectedIdx ? { ...f, designData: { ...f.designData, elements: els } } : f))}
                />
              </div>
              {/* Layout Selector */}
              <div className="mb-4">
                <h2 className="font-semibold mb-2 text-gray-800">Layout Style</h2>
                <select name="layout" value={formats[selectedIdx].designData.layout} onChange={handleChange} className="border rounded p-2 bg-gray-50 text-gray-900 font-semibold">
                  <option value="classic">Classic</option>
                  <option value="modern">Modern</option>
                  <option value="compact">Compact</option>
                  <option value="elegant">Elegant</option>
                  <option value="bold">Bold</option>
                  <option value="minimal">Minimal</option>
                  <option value="thermal">Thermal (Shop)</option>
                </select>
              </div>
              {/* Signature Image Upload */}
              <div className="mb-4">
                <h2 className="font-semibold mb-2 text-gray-800">Signature Image</h2>
                <input type="file" accept="image/*" onChange={handleSignatureUpload} className="block" />
                {signatureImg && <img src={signatureImg} alt="Signature" className="h-12 mt-2 border rounded shadow" />}
              </div>
              {/* Font & Color */}
              <div className="mb-4">
                <h2 className="font-semibold mb-2 text-gray-800">Font</h2>
                <select name="font" value={formats[selectedIdx].designData.font} onChange={handleChange} className="border rounded p-2 bg-gray-50 text-gray-900">
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Georgia">Georgia</option>
                </select>
              </div>
              <div className="mb-4">
                <h2 className="font-semibold mb-2 text-gray-800">Primary Color</h2>
                <input type="color" name="color" value={formats[selectedIdx].designData.color} onChange={handleChange} className="w-12 h-8 p-0 border-none rounded shadow" />
              </div>
              <div className="mb-4 flex gap-6 items-center">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="showBorder" checked={formats[selectedIdx].designData.showBorder} onChange={handleChange} /> Show Border
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="showGrid" checked={formats[selectedIdx].designData.showGrid} onChange={handleChange} /> Show Grid
                </label>
                <button onClick={handlePreview} className="ml-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded shadow transition" type="button">{formats[selectedIdx].designData.preview ? 'Hide Preview' : 'Preview'}</button>
              </div>
              {saveError && <div className="text-red-600 mb-2">{saveError}</div>}
            </div>
            {/* Preview Card */}
            <div className="flex-1">
              {formats[selectedIdx].designData.preview && (
                <div className="border rounded-2xl shadow-2xl p-6 mt-2 bg-white">
                  <h3 className="font-semibold mb-2 text-xl text-gray-800">Live Preview</h3>
                  <ReceiptFullPreview
                    columns={formats[selectedIdx].designData.columns}
                    elements={formats[selectedIdx].designData.elements}
                    font={formats[selectedIdx].designData.font}
                    color={formats[selectedIdx].designData.color}
                    layout={formats[selectedIdx].designData.layout}
                    signatureImg={signatureImg}
                  />
                </div>
              )}
            </div>
          </div>
          <button
            className="block mx-auto mt-12 mb-12 bg-green-700 hover:bg-green-800 text-white px-8 py-3 rounded-xl shadow-lg transition font-bold text-lg"
            style={{ minWidth: 220 }}
            onClick={() => { handleSave(); }}
            type="button"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Bill Design'}
          </button>
          <Footer />
        </div>
      </div>
    </main>
  );
}