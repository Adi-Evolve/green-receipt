"use client";

import { useRef, useState, useEffect } from 'react';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const businessId = typeof window !== 'undefined' ? localStorage.getItem('businessId') || '' : '';

  useEffect(() => {
    if (!businessId) return;
    fetch(`/api/templates/${businessId}`)
      .then(res => res.json())
      .then(setTemplates);
  }, [businessId]);

  function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!fileInput.current?.files?.[0]) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('template', fileInput.current.files[0]);
    fetch(`/api/templates/${businessId}`, { method: 'POST', body: formData })
      .then(res => res.json())
      .then(() => {
        setUploading(false);
        fileInput.current!.value = '';
        fetch(`/api/templates/${businessId}`)
          .then(res => res.json())
          .then(setTemplates);
      });
  }

  function handleSelect(tmpl: string) {
    setSelected(tmpl);
    localStorage.setItem('selectedTemplate', tmpl);
  }

  return (
    <div>
      <ServerNavbar isLoggedIn={true} />
      <main className="max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-6">Custom Templates</h1>
        <form className="mb-6" onSubmit={handleUpload}>
          <input type="file" ref={fileInput} accept=".html,.pdf,.docx" className="border p-2 rounded mr-2" required />
          <button className="btn-primary" type="submit" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload Template'}</button>
        </form>
        <div className="mb-4 font-semibold">Your Templates:</div>
        <div className="space-y-2">
          {templates.map(tmpl => (
            <div key={tmpl} className={`p-3 rounded border flex items-center justify-between ${selected === tmpl ? 'bg-green-100 border-green-400' : 'bg-white border-gray-200'}`}>
              <span>{tmpl}</span>
              <button className="btn-secondary ml-4" onClick={() => handleSelect(tmpl)}>{selected === tmpl ? 'Selected' : 'Select'}</button>
            </div>
          ))}
          {templates.length === 0 && <div className="text-gray-500">No templates uploaded yet.</div>}
        </div>
      </main>
      <Footer />
    </div>
  );
}
