"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Head from "next/head";
import ReceiptView from "./ReceiptView";
import { supabase } from '@/lib/supabaseClient';
import html2pdf from "html2pdf.js";

export default function ViewReceiptPage() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      let data, error;
      // Try by id
      ({ data, error } = await supabase.from('receipts').select('*').eq('id', id).maybeSingle());
      // Try by qr_code if not found
      if (!data) {
        ({ data, error } = await supabase.from('receipts').select('*').eq('qr_code', id).maybeSingle());
      }
      // Try by receipt_id if still not found
      if (!data) {
        ({ data, error } = await supabase.from('receipts').select('*').eq('receipt_id', id).maybeSingle());
      }
      if (error || !data) {
        setError('Receipt not found');
      } else {
        // --- Fetch business info from DB using user_code ---
        let businessInfo = data.businessInfo || {};
        let userCode = data.user_code || data.businessId || data.business_id || '';
        if (userCode) {
          const { data: bizData } = await supabase.from('businesses').select('*').eq('businessId', userCode).maybeSingle();
          if (bizData) {
            businessInfo = {
              ...businessInfo,
              ...bizData,
              name: bizData.businessName || bizData.name || businessInfo.name,
              businessId: bizData.businessId || businessInfo.businessId,
              logoUrl: bizData.logoUrl || businessInfo.logoUrl,
              address: bizData.address || businessInfo.address,
              phone: bizData.phone || businessInfo.phone,
              email: bizData.email || businessInfo.email,
            };
          }
        }
        // Always ensure products is an array (parse if string)
        let productsArr: any[] = [];
        if (Array.isArray(data.products)) {
          productsArr = data.products;
        } else if (typeof data.products === 'string') {
          try {
            const parsed = JSON.parse(data.products);
            if (Array.isArray(parsed)) productsArr = parsed;
          } catch {}
        }
        setReceipt({ ...data, businessInfo, products: productsArr });
      }
    })();
  }, [id]);

  // PDF download using html2pdf.js
  function handleDownloadPDF() {
    if (!receiptRef.current) return;
    html2pdf()
      .from(receiptRef.current)
      .set({
        margin: 0.3,
        filename: `receipt_${receipt?.receiptNumber || id}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      })
      .save();
  }

  // When a receipt is generated, update product stock
  async function updateInventoryAfterSale(productsSold: any[]) {
    const businessId = typeof window !== 'undefined' ? localStorage.getItem('businessId') : '';
    let inventory: any[] = [];
    if (businessId) {
      try {
        inventory = JSON.parse(localStorage.getItem(`products_${businessId}`) || '[]');
      } catch {}
    }
    const updated = inventory.map(prod => {
      const sold = productsSold.find((p: any) => p.sku === prod.sku);
      if (sold) {
        return { ...prod, stock: (prod.stock || 0) - (sold.quantity || 0) };
      }
      return prod;
    });
    localStorage.setItem(`products_${businessId}`, JSON.stringify(updated));
    // Sync to Supabase
    for (const prod of updated) {
      await supabase.from('products').update({ stock: prod.stock }).eq('sku', prod.sku).eq('businessId', businessId);
    }
  }

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!receipt) return <div className="p-8">Loading...</div>;

  // Try to get logoUrl from receipt, businessInfo, or localStorage
  let logoUrl = receipt.businessInfo?.logoUrl || "";
  if (!logoUrl && typeof window !== "undefined") {
    logoUrl = localStorage.getItem("logoUrl") || "";
  }

  // After receipt is saved (wherever you save receipts), call updateInventoryAfterSale(receipt.products)
  // For demonstration purposes, we'll call it here, but in a real scenario, you would call it after saving the receipt
  updateInventoryAfterSale(receipt.products);

  return (
    <>
      <Head>
        <title>Receipt #{receipt.receiptNumber} | Green Receipt</title>
        {logoUrl && <link rel="icon" href={logoUrl} />}
      </Head>
      <div className="p-8">
        <div ref={receiptRef} id="receipt-pdf-content">
          <ReceiptView receipt={{ ...receipt, logoUrl }} />
        </div>
        <button className="btn-primary mt-4" onClick={handleDownloadPDF}>Download PDF</button>
      </div>
    </>
  );
}
