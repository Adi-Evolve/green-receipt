"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

export default function ReceiptDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchReceipt() {
      setLoading(true);
      setError("");
      // Try Supabase first
      let data = null;
      try {
        const { data: supaData, error: supaErr } = await supabase.from("receipts").select("*").eq("id", id).single();
        if (supaErr) throw supaErr;
        if (supaData) data = supaData;
      } catch {
        // Try localStorage fallback
        try {
          const businessId = typeof window !== "undefined" ? localStorage.getItem("businessId") : "";
          const local = businessId ? localStorage.getItem(`receipts_${businessId}`) : null;
          if (local) {
            const arr = JSON.parse(local);
            data = arr.find((r: any) => r.id === id);
          }
        } catch {}
      }
      if (!data) setError("Receipt not found");
      setReceipt(data);
      setLoading(false);
    }
    fetchReceipt();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!receipt) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12">
      <div className="bg-white rounded-lg shadow p-8 max-w-lg w-full">
        <h1 className="text-2xl font-bold mb-4 text-[#017a5a]">Receipt Details</h1>
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">Receipt ID: <span className="font-mono">GR-{receipt.businessId || ''}-{receipt.serialNo || receipt.id}</span></div>
          <div className="text-sm text-gray-600 mb-2">Customer: <span className="font-semibold">{receipt.customerName || receipt.customer_name || '-'}</span></div>
          <div className="text-sm text-gray-600 mb-2">Date: {receipt.date}</div>
          <div className="text-sm text-gray-600 mb-2">Total: ₹{receipt.total}</div>
        </div>
        {receipt.products && Array.isArray(receipt.products) && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Products</h2>
            <ul className="list-disc pl-6">
              {receipt.products.map((p: any, idx: number) => (
                <li key={idx}>{p.name} x {p.quantity} @ ₹{p.price}</li>
              ))}
            </ul>
          </div>
        )}
        <Link href="/dashboard" className="inline-block mt-4 px-4 py-2 rounded bg-[#017a5a] text-white hover:bg-[#008c7e] font-semibold">Back to Dashboard</Link>
      </div>
    </div>
  );
}
