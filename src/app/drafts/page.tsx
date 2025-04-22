"use client";
import React, { useState, useEffect } from 'react';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabaseClient';
import { addEntity, updateEntity, deleteEntity } from '@/lib/dataSync';

export default function DraftsPage() {
  // Fetch drafts from localStorage and Supabase
  const [drafts, setDrafts] = useState<any[]>([]);
  const businessId = typeof window !== 'undefined' ? localStorage.getItem('businessId') || '' : '';

  // Load drafts from localStorage first, then Supabase if not found
  useEffect(() => {
    let localDrafts: any[] = [];
    if (businessId) {
      const local = localStorage.getItem('drafts_' + businessId);
      if (local) {
        localDrafts = JSON.parse(local);
        setDrafts(localDrafts);
      }
    }
    // Always fetch from Supabase and update localStorage for sync
    if (businessId) {
      supabase.from('drafts').select('*').eq('business_id', businessId).then(({ data }) => {
        if (data) {
          setDrafts(data);
          localStorage.setItem('drafts_' + businessId, JSON.stringify(data));
        }
      });
    }
  }, [businessId]);

  async function addDraft(newDraft: any) {
    await addEntity('drafts', newDraft, setDrafts);
  }

  async function updateDraft(updatedDraft: any) {
    await updateEntity('drafts', updatedDraft, setDrafts);
  }

  async function deleteDraft(id: string) {
    await deleteEntity('drafts', id, setDrafts);
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <ServerNavbar isLoggedIn={true} />
      <div className="flex-grow max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-primary-800 mb-6">Draft Receipts</h1>
        {drafts.length === 0 ? (
          <div className="text-center text-gray-500">No drafts yet. Start creating a bill and your drafts will appear here.</div>
        ) : (
          <ul className="space-y-4">
            {drafts.map((draft, idx) => (
              <li key={idx} className="bg-white p-4 rounded shadow flex justify-between items-center">
                <span>Draft #{draft.receiptNumber || draft.draftId} - Last edited: {draft.date}</span>
                <button className="btn-primary" onClick={() => {
                  // Edit draft: redirect to generate-receipt with draft data
                  localStorage.setItem('draftToResume', JSON.stringify(draft));
                  window.location.href = '/generate-receipt?draft=1';
                }}>Edit</button>
                <button className="btn-danger" onClick={() => deleteDraft(draft.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Footer />
    </main>
  );
}
