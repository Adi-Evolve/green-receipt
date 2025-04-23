"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Head from "next/head";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ReceiptView from "./ReceiptView";
import { supabase } from '@/lib/supabaseClient';

// Attach autoTable to jsPDF prototype if not already attached (for Next.js/Vercel)
if (typeof window !== "undefined" && autoTable) {
  // @ts-ignore
  jsPDF.prototype.autoTable = autoTable;
}

export default function ViewReceiptPage() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

  function handleDownloadPDF() {
    if (!receipt) return;
    const doc = new jsPDF();
    // @ts-ignore
    if (typeof doc.autoTable !== "function") {
      alert("PDF table export is not available. Please ensure jspdf-autotable is installed.");
      return;
    }
    const format = receipt.format || {};
    const columnOrder = format.columns ? Object.keys(format.columns).filter(k => format.columns[k]) : ["product", "quantity", "price", "amount"];
    const columnLabels: Record<string, string> = {
      serial: "Serial",
      product: "Product",
      quantity: "Quantity",
      gst: "GST",
      price: "Price",
      amount: "Amount",
      discount: "Discount"
    };
    doc.setFont(format.font || "Arial");
    doc.setTextColor(format.color || "#000000");
    doc.text(receipt.businessInfo?.name || "Business Name", 14, 15);
    doc.text(receipt.businessInfo?.address || "", 14, 22);
    doc.text(receipt.businessInfo?.phone || "", 14, 29);
    doc.text(receipt.businessInfo?.email || "", 14, 36);
    doc.text("Receipt No: " + (receipt.receiptNumber || receipt.id), 150, 15);
    doc.text("Date: " + receipt.date, 150, 22);
    const columns = columnOrder.map((col: keyof typeof columnLabels) => columnLabels[col] || col);
    const dataRows = (receipt.products || []).map((p: any, idx: number) => {
      return columnOrder.map((col: keyof typeof columnLabels) => {
        if (col === "serial") return idx + 1;
        if (col === "product") return p.name;
        if (col === "quantity") return p.quantity;
        if (col === "gst") return p.gst;
        if (col === "price") return p.price;
        if (col === "amount") return (p.price * p.quantity * (format.columns?.gst ? (1 + (p.gst || 0)/100) : 1)).toFixed(2);
        if (col === "discount") return p.discount || 0;
        return "";
      });
    });
    // @ts-ignore
    doc.autoTable({
      head: [columns],
      body: dataRows,
      startY: 45,
      theme: format.showGrid ? "grid" : "plain",
      styles: { font: format.font || "Arial", textColor: format.color || "#000000" },
      tableLineWidth: format.showBorder ? 0.1 : 0,
    });
    let y = 55;
    // @ts-ignore
    if (doc.lastAutoTable && typeof doc.lastAutoTable.finalY === "number") {
      // @ts-ignore
      y = doc.lastAutoTable.finalY + 10;
    }
    if (format.elements?.termsAndConditions && receipt.terms) {
      doc.text("Terms: " + receipt.terms, 14, y);
      y += 7;
    }
    if (format.elements?.notes && receipt.notes) {
      doc.text("Notes: " + receipt.notes, 14, y);
      y += 7;
    }
    if (format.elements?.signature) {
      doc.text("Signature: ___________________", 14, y);
      y += 7;
    }
    doc.save(`receipt_${receipt.receiptNumber || id}.pdf`);
  }

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!receipt) return <div className="p-8">Loading...</div>;

  // Try to get logoUrl from receipt, businessInfo, or localStorage
  let logoUrl = receipt.businessInfo?.logoUrl || "";
  if (!logoUrl && typeof window !== "undefined") {
    logoUrl = localStorage.getItem("logoUrl") || "";
  }

  return (
    <>
      <Head>
        <title>Receipt #{receipt.receiptNumber} | Green Receipt</title>
        {logoUrl && <link rel="icon" href={logoUrl} />}
      </Head>
      <div className="p-8">
        <ReceiptView receipt={{ ...receipt, logoUrl }} />
        <button className="btn-primary mt-4" onClick={handleDownloadPDF}>Download PDF</button>
      </div>
    </>
  );
}
