"use client";

import React, { useEffect, useState } from 'react';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';

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

  // Defensive helper to safely get columns object
  function getColumns(format: BillDesign | undefined): Record<string, boolean> {
    return format && format.designData && format.designData.columns ? format.designData.columns as Record<string, boolean> : {};
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <main className="min-h-screen flex flex-col">
      <ServerNavbar isLoggedIn={true} />
      <div className="flex-grow bg-gray-50">
        <div className="max-w-xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold mb-6">Bill Designs</h1>
          <div className="flex gap-2 mb-4">
            {formats.map((format, idx) => (
              <div key={idx} className={`px-4 py-2 rounded-t cursor-pointer ${selectedIdx === idx ? 'bg-white border-t-2 border-primary-500 font-bold' : 'bg-gray-200'}`}
                onClick={() => setSelectedIdx(idx)}>
                {renamingIdx === idx ? (
                  <input
                    value={renameValue}
                    onChange={handleRenameChange}
                    onBlur={() => handleRenameSave(idx)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRenameSave(idx); }}
                    className="border px-2 py-1 rounded text-sm"
                    autoFocus
                  />
                ) : (
                  <span className="font-bold text-base cursor-pointer" onClick={() => handleRename(idx)}>{format.name}</span>
                )}
              </div>
            ))}
            <button className="px-4 py-2 bg-primary-500 text-white rounded-t" onClick={handleCreateNew} type="button">+ Create New Design</button>
          </div>
          {formats[selectedIdx] && (
            <div className="bg-white rounded shadow p-6 space-y-6">
              <div className="mb-4">
                <h2 className="font-semibold mb-2">Columns</h2>
                <div className="flex flex-wrap gap-4">
                  {Object.keys(getColumns(formats[selectedIdx])).map((key) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!formats[selectedIdx].designData.columns[key]}
                        onChange={() => handleToggle('columns', key)}
                      />
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <h2 className="font-semibold mb-2">Elements</h2>
                <div className="flex flex-wrap gap-4">
                  {Object.keys(formats[selectedIdx]?.designData?.elements as Record<string, boolean> || {}).map((key) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(formats[selectedIdx]?.designData?.elements?.[key])}
                        onChange={() => handleToggle('elements', key)}
                      />
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                  ))}
                  {(!formats[selectedIdx]?.designData?.elements || Object.keys(formats[selectedIdx]?.designData?.elements || {}).length === 0) && (
                    <span className="text-gray-500">No elements available.</span>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <h2 className="font-semibold mb-2">Font</h2>
                <select name="font" value={formats[selectedIdx].designData.font} onChange={handleChange} className="border rounded p-2">
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>
              <div className="mb-4">
                <h2 className="font-semibold mb-2">Primary Color</h2>
                <input type="color" name="color" value={formats[selectedIdx].designData.color} onChange={handleChange} className="w-12 h-8 p-0 border-none" />
              </div>
              <div className="mb-4">
                <h2 className="font-semibold mb-2">Layout</h2>
                <select name="layout" value={formats[selectedIdx].designData.layout} onChange={handleChange} className="border rounded p-2">
                  <option value="default">Default</option>
                  <option value="compact">Compact</option>
                  <option value="modern">Modern</option>
                </select>
              </div>
              <div className="mb-4 flex gap-6 items-center">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="showBorder" checked={formats[selectedIdx].designData.showBorder} onChange={handleChange} /> Show Border
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="showGrid" checked={formats[selectedIdx].designData.showGrid} onChange={handleChange} /> Show Grid
                </label>
                <button onClick={handlePreview} className="btn-secondary ml-4" type="button">{formats[selectedIdx].designData.preview ? 'Hide Preview' : 'Preview'}</button>
              </div>
              {formats[selectedIdx].designData.preview && (
                <div className="border rounded p-4 mt-4 bg-gray-50">
                  <h3 className="font-semibold mb-2">Live Preview</h3>
                  <div style={{ fontFamily: formats[selectedIdx].designData.font, color: formats[selectedIdx].designData.color }}>
                    <table className={`w-full ${formats[selectedIdx].designData.showBorder ? 'border' : ''} ${formats[selectedIdx].designData.showGrid ? 'border-collapse' : ''}`}>
                      <thead>
                        <tr>
                          {Object.entries(getColumns(formats[selectedIdx])).filter(([_, v]) => v).map(([k]) => (
                            <th key={k} className="border px-2 py-1">{k.charAt(0).toUpperCase() + k.slice(1)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {Object.entries(getColumns(formats[selectedIdx])).filter(([_, v]) => v).map(([k]) => (
                            <td key={k} className="border px-2 py-1">Sample</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                    {formats[selectedIdx].designData.elements.signature && <div className="mt-4 italic">Signature: ___________________</div>}
                    {formats[selectedIdx].designData.elements.notes && <div className="mt-2 text-sm text-gray-600">Notes: Sample notes here...</div>}
                  </div>
                </div>
              )}
            </div>
          )}
          {saveError && <div className="text-red-600 mb-2">{saveError}</div>}
          <button className="btn-primary mt-4" onClick={() => { handleSave(); }} type="button" disabled={saving}>{saving ? 'Saving...' : 'Save Bill Design'}</button>
        </div>
      </div>
      <Footer />
    </main>
  );
}