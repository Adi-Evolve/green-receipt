"use client";

import React, { useState, useEffect } from 'react';
import ServerNavbar from '@/components/ServerNavbar';
import Footer from '@/components/Footer';
import { MdLocalOffer, MdAdd } from 'react-icons/md';
import { supabase } from '@/lib/supabaseClient';
import { addEntity, updateEntity, deleteEntity } from '@/lib/dataSync';

interface Offer {
  id: string;
  title: string;
  description: string;
  validTill: string;
  business_id: string;
}

const SAMPLE_OFFERS: Offer[] = [];

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newOffer, setNewOffer] = useState({ title: '', description: '', validTill: '', business_id: '' });
  const businessId = typeof window !== 'undefined' ? localStorage.getItem('businessId') || '' : '';

  // Load offers from localStorage first, then Supabase if not found
  useEffect(() => {
    let localOffers: any[] = [];
    if (businessId) {
      const local = localStorage.getItem('offers_' + businessId);
      if (local) {
        localOffers = JSON.parse(local);
        setOffers(localOffers);
      }
    }
    // Always fetch from Supabase and update localStorage for sync
    if (businessId) {
      supabase.from('offers').select('*').eq('business_id', businessId).then(({ data }) => {
        if (data) {
          setOffers(data);
          localStorage.setItem('offers_' + businessId, JSON.stringify(data));
        }
      });
    }
  }, [businessId]);

  async function addOffer(newOffer: any) {
    await addEntity('offers', newOffer, setOffers);
  }

  async function updateOffer(updatedOffer: any) {
    await updateEntity('offers', updatedOffer, setOffers);
  }

  async function deleteOffer(id: string) {
    await deleteEntity('offers', id, setOffers);
  }

  function sendOfferToAllCustomers(offer: Offer) {
    // WhatsApp does not allow sending to multiple numbers at once via API without user interaction
    // Only possible via WhatsApp Business API (requires approval, server, not client-side)
    // Here, we just open WhatsApp for each customer (user must send each manually)
    let customers: any[] = [];
    try {
      customers = JSON.parse(localStorage.getItem(`customers_${businessId}`) || '[]');
    } catch {}
    customers.forEach(cust => {
      if (cust.phone) {
        const phone = cust.phone.replace(/\D/g, '');
        let msg = `Special Offer from our store!\n${offer.title}\n${offer.description}\nValid till: ${offer.validTill}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    });
  }

  function handleAddOffer(e: React.FormEvent) {
    e.preventDefault();
    const newOfferObj = { ...newOffer, id: String(Date.now()), business_id: businessId };
    addOffer(newOfferObj).then(() => {
      setShowForm(false);
      setNewOffer({ title: '', description: '', validTill: '', business_id: businessId });
      sendOfferToAllCustomers(newOfferObj);
    });
  }

  return (
    <main className="min-h-screen flex flex-col">
      <ServerNavbar isLoggedIn={true} />
      <div className="flex-grow bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <MdLocalOffer className="text-3xl text-yellow-600" /> Offers & Promotions
          </h1>
          <button className="btn-primary flex items-center mb-4" onClick={() => setShowForm(v => !v)}>
            <MdAdd className="mr-2" /> {showForm ? 'Cancel' : 'Add Offer'}
          </button>
          {showForm && (
            <form className="bg-white rounded shadow p-4 mb-4" onSubmit={handleAddOffer}>
              <input className="border p-2 mb-2 w-full" placeholder="Title" value={newOffer.title} onChange={e => setNewOffer(o => ({ ...o, title: e.target.value }))} required />
              <textarea className="border p-2 mb-2 w-full" placeholder="Description" value={newOffer.description} onChange={e => setNewOffer(o => ({ ...o, description: e.target.value }))} required />
              <input className="border p-2 mb-2 w-full" type="date" value={newOffer.validTill} onChange={e => setNewOffer(o => ({ ...o, validTill: e.target.value }))} required />
              <button className="btn-primary" type="submit">Save Offer</button>
            </form>
          )}
          <div className="space-y-4">
            {offers.map(offer => (
              <div key={offer.id} className="bg-white rounded shadow p-4">
                <div className="font-semibold text-lg flex items-center gap-2">
                  <MdLocalOffer className="text-xl text-yellow-600" /> {offer.title}
                </div>
                <div className="text-gray-700 mb-2">{offer.description}</div>
                <div className="text-xs text-gray-500">Valid Till: {offer.validTill}</div>
                <button className="btn-danger ml-2" onClick={() => deleteOffer(offer.id)}>Delete</button>
              </div>
            ))}
            {offers.length === 0 && <div className="text-gray-500">No offers available.</div>}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
