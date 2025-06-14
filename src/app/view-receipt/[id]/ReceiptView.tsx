import React, { useEffect, useState } from "react";
import { supabase } from '@/lib/supabaseClient';
import { RECEIPT_TEMPLATES } from '../../components/ReceiptTemplates';
import QRCode from 'react-qr-code';

export default function ReceiptView({ receipt: initialReceipt, id }: { receipt?: any, id?: string }) {
  const [receipt, setReceipt] = useState<any>(initialReceipt || null);
  const [loading, setLoading] = useState(!initialReceipt);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!receipt && id) {
      setLoading(true);
      supabase.from('receipts').select('*').eq('id', id).single()
        .then(({ data, error }) => {
          if (error || !data) setError('Failed to fetch receipt.');
          else setReceipt(data);
          setLoading(false);
        });
    }
  }, [id, receipt]);

  if (loading) return <div className="text-center p-8">Loading receipt...</div>;
  if (error) return <div className="text-center text-red-600 p-8">{error}</div>;
  if (!receipt) return <div className="text-center text-gray-500 p-8">Receipt not found.</div>;

  // Determine template
  const templateId = (typeof window !== 'undefined' && localStorage.getItem('receiptTemplate')) || 'classic';
  const template = RECEIPT_TEMPLATES.find(t => t.id === templateId) || RECEIPT_TEMPLATES[0];

  // Template-based classes for sections
  const headerClass = template.id === 'colorful'
    ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-t-xl'
    : template.id === 'modern'
      ? 'bg-gray-50 border-l-8 border-primary-600'
      : 'bg-white border-b border-gray-400';
  const tableClass = template.id === 'colorful'
    ? 'bg-white rounded-b-xl shadow-lg'
    : template.id === 'modern'
      ? 'bg-white border border-primary-100'
      : 'bg-white border border-gray-300';
  const totalsClass = template.id === 'colorful'
    ? 'bg-gradient-to-r from-green-100 to-blue-100 text-primary-800'
    : template.id === 'modern'
      ? 'bg-primary-50 text-primary-900'
      : 'bg-gray-100';

  // Always use business info from localStorage if available
  let businessProfile: any = {};
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('businessInfo');
    if (saved) {
      try { businessProfile = JSON.parse(saved); } catch {}
    }
  }
  const businessName = businessProfile.businessName || businessProfile.name || receipt.businessInfo?.name || receipt.businessName || receipt.business_info_name || 'Business Name';
  const businessId = businessProfile.businessId || receipt.businessInfo?.businessId || receipt.businessId || receipt.business_info_id || '';
  const logoUrl = businessProfile.logoUrl || receipt.logoUrl;
  const address = businessProfile.address || receipt.businessInfo?.address || receipt.businessAddress || '';
  const phone = businessProfile.phone || receipt.businessInfo?.phone || receipt.businessPhone || '';
  const email = businessProfile.email || receipt.businessInfo?.email || receipt.businessEmail || '';

  const format = receipt.format || {};
  // Compute columns based on format.columns order
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
  const showSignature = !!format.elements?.signature;
  const showTerms = !!format.elements?.termsAndConditions && !!receipt.terms;
  const showNotes = !!format.elements?.notes && !!receipt.notes;

  // Compute QR code URL
  const receiptId = receipt.qrCode || receipt.receiptUniqueId || receipt.id;
  const qrValue = typeof window !== 'undefined' && window.location
    ? `${window.location.origin}/view-receipt/${receiptId}`
    : receiptId;

  // Defensive: ensure products is always an array
  let productsArr: any[] = [];
  if (Array.isArray(receipt?.products)) {
    productsArr = receipt.products;
  } else if (typeof receipt?.products === 'string') {
    try {
      const parsed = JSON.parse(receipt.products);
      if (Array.isArray(parsed)) productsArr = parsed;
    } catch {}
  }

  // Layout: Business info (left), Customer info (right)
  return (
    <div
      className="w-full bg-white rounded-xl shadow-lg p-6"
      id="receipt-content"
    >
      {/* Header Row: Business (left), Customer (right) */}
      <div className="flex flex-row justify-between items-start mb-4">
        {/* Business Info (left) */}
        <div className="flex-1 pr-8">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="h-14 mb-2" />
          )}
          <div className="text-xl font-bold leading-tight">{businessName}</div>
          <div className="text-sm opacity-80">{address}</div>
          <div className="text-sm opacity-80">{phone}</div>
          <div className="text-sm opacity-80">{email}</div>
        </div>
        {/* Customer Info (right) */}
        <div className="flex-1 pl-8 text-right">
          <div className="text-base font-semibold mb-1">Customer Details</div>
          {/* Enhanced customer name logic: show from DB if exists, else fallback to receipt input */}
          <div className="text-sm opacity-80">{receipt.customerName || receipt.customer_name || receipt.customer || '-'}</div>
          <div className="text-sm opacity-80">{receipt.customerPhone || receipt.customer_phone || '-'}</div>
          <div className="text-sm opacity-80">{receipt.customerEmail || receipt.customer_email || '-'}</div>
          <div className="text-sm opacity-80">{receipt.customerAddress || receipt.customer_address || '-'}</div>
        </div>
      </div>

      {/* Receipt Info Row */}
      <div className={`flex justify-between items-center px-8 py-2 border-b ${template.previewClass}`}>
        <div className="text-sm font-semibold">
          Receipt No: <span className="font-mono">{receipt.receiptNumber || receipt.receipt_number || receipt.id}</span>
        </div>
        <div className="text-sm">
          Date: <span className="font-mono">{receipt.date}</span>
        </div>
      </div>

      {/* Products Table */}
      <div className={`px-8 py-4 ${tableClass}`}>
        <table className="w-full text-sm">
          <thead>
            <tr>
              {columnOrder.map((col) => (
                <th key={col} className="px-3 py-1 text-left font-semibold opacity-80">{columnLabels[col]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {productsArr.map((p: any, idx: number) => (
              <tr key={idx} className="border-b">
                {columnOrder.map((col) => {
                  if (col === "serial") return <td key={col} className="px-3 py-1">{idx + 1}</td>;
                  if (col === "product") return <td key={col} className="px-3 py-1">{p.name || p.productName}</td>;
                  if (col === "quantity") return <td key={col} className="px-3 py-1">{p.quantity}</td>;
                  if (col === "gst") return <td key={col} className="px-3 py-1">{p.gst}</td>;
                  if (col === "price") return <td key={col} className="px-3 py-1">{p.price}</td>;
                  if (col === "amount") return <td key={col} className="px-3 py-1">{(p.price * p.quantity * (format.columns?.gst ? (1 + (p.gst || 0)/100) : 1)).toFixed(2)}</td>;
                  if (col === "discount") return <td key={col} className="px-3 py-1">{p.discount || 0}</td>;
                  return <td key={col} className="px-3 py-1"></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className={`flex flex-col items-end mt-4 ${totalsClass}`}>
        <div className="text-base font-bold">Total: ₹{(() => {
          if (productsArr.length > 0) {
            return productsArr.reduce((sum: number, p: any) => sum + (p.price * p.quantity * (format.columns?.gst ? (1 + (p.gst || 0)/100) : 1)), 0).toFixed(2);
          }
          return receipt.totalAmount || receipt.total || '-';
        })()}</div>
      </div>

      {/* QR Code for direct receipt view */}
      <div className="flex flex-col items-center mt-6">
        <div className="mb-2 text-sm text-gray-600">Scan to view this receipt online:</div>
        <QRCode value={qrValue} size={110} />
        <div className="mt-1 text-xs text-gray-400 break-all">{qrValue}</div>
      </div>

      {/* Download PDF Button */}
      <div className="flex justify-end mt-6">
        <button
          className="px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
          onClick={() => {
            import('html2pdf.js').then((html2pdf) => {
              const element = document.getElementById('receipt-content');
              if (element) {
                html2pdf.default().from(element).save(`receipt-${receipt.receiptNumber || receipt.id}.pdf`);
              }
            });
          }}
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}
