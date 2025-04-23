import React, { useEffect, useState } from "react";
import { supabase } from '@/lib/supabaseClient';
import { RECEIPT_TEMPLATES } from '../../components/ReceiptTemplates';

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

  // --- PROFESSIONAL RECEIPT LAYOUT ---
  return (
    <div
      className="max-w-2xl mx-auto bg-white shadow-xl rounded-lg border border-gray-300 p-0 relative overflow-hidden print:max-w-full print:shadow-none print:border-0"
      style={{ fontFamily: format.font || 'Segoe UI, Arial, sans-serif', color: format.color || '#222', minWidth: 400 }}
    >
      {/* Receipt Header */}
      <div className={`flex flex-col items-center py-6 px-8 ${headerClass}`}>
        <div className="text-2xl font-bold mb-1">{businessName}</div>
        {logoUrl && (
          <img src={logoUrl} alt="Logo" className="h-12 mb-2" />
        )}
        <div className="text-sm opacity-80">{address}</div>
        <div className="text-sm opacity-80">{phone}</div>
        <div className="text-sm opacity-80">{email}</div>
      </div>
      {/* Receipt Info Row */}
      <div className={`flex justify-between items-center px-8 py-2 border-b ${template.previewClass}`}>
        <div className="text-sm font-semibold">Receipt No: <span className="font-mono">{receipt.receiptNumber || receipt.receipt_number || receipt.id}</span></div>
        <div className="text-sm">Date: <span className="font-mono">{receipt.date}</span></div>
      </div>
      {/* Products Table */}
      <div className={`px-8 py-4 ${tableClass}`}>
        {(!receipt.products || receipt.products.length === 0) && (
          <div className="mb-2 text-red-600 text-xs">No products found for this receipt.</div>
        )}
        {process.env.NODE_ENV !== 'production' && (
          <pre className="bg-gray-100 text-xs p-2 mb-2 rounded overflow-x-auto">{JSON.stringify(receipt.products, null, 2)}</pre>
        )}
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              {columnOrder.map((col) => (
                <th key={col} className="border-b border-gray-300 py-2 px-3 font-semibold text-left">{columnLabels[col] || col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(receipt.products || []).map((p: any, idx: number) => (
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
        {/* Totals */}
        <div className={`flex flex-col items-end mt-4 ${totalsClass}`}>
          <div className="text-base font-bold">Total: ₹{(() => {
            if (receipt.products && receipt.products.length > 0) {
              return receipt.products.reduce((sum: number, p: any) => sum + (p.price * p.quantity * (format.columns?.gst ? (1 + (p.gst || 0)/100) : 1)), 0).toFixed(2);
            }
            return receipt.totalAmount || receipt.total || '-';
          })()}</div>
          {receipt.discount && <div>Discount: <span>{receipt.discount}</span></div>}
          {receipt.tax && <div>Tax: <span>{receipt.tax}</span></div>}
          {receipt.grandTotal && <div>Grand Total: <span className="font-bold">{receipt.grandTotal}</span></div>}
        </div>
      </div>
      {/* Terms, Notes, Signature */}
      <div className="px-8 pb-4">
        {showTerms && (
          <div className="mt-2 text-xs text-gray-600">Terms: {receipt.terms}</div>
        )}
        {showNotes && (
          <div className="mt-2 text-xs text-gray-500">Notes: {receipt.notes}</div>
        )}
        {showSignature && (
          <div className="mt-8 flex justify-end">
            <div className="italic text-right text-gray-800 border-t border-gray-400 pt-2 w-48">Signature: ___________________</div>
          </div>
        )}
      </div>
      {/* QR or barcode placeholder */}
      <div className="flex flex-col items-center pb-8">
        {qrValue ? (
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrValue)}`} alt="QR Code" className="mt-2" />
        ) : (
          <div className="w-24 h-24 bg-gray-200 rounded mt-2 flex items-center justify-center text-xs text-gray-500">QR Code</div>
        )}
      </div>
    </div>
  );
}
