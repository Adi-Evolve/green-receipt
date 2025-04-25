"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ReceiptClient({ id }: { id: string }) {
  const [receipt, setReceipt] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchReceipt() {
      try {
        const localReceipts = JSON.parse(localStorage.getItem("receipts_" + (localStorage.getItem("businessId") || "")) || "[]");
        const found = localReceipts.find((r: any) => r.id === id || r.receiptId === id);
        if (found) {
          setReceipt(found);
        } else {
          // Optionally, fetch from remote DB here
          setError("Receipt not found");
        }
      } catch (err) {
        setError("Error loading receipt");
      }
    }
    fetchReceipt();
  }, [id]);

  if (error) {
    return (
      <div className="p-6 text-red-600">
        <p>{error}</p>
        <button className="btn-secondary mt-4" onClick={() => router.back()}>Back</button>
      </div>
    );
  }

  if (!receipt) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">Receipt #{receipt.receiptNumber || receipt.id}</h2>
      <div className="mb-4">Customer: {receipt.customerName || receipt.customer || "-"}</div>
      <div className="mb-4">Date: {receipt.date || "-"}</div>
      <div className="mb-4">Amount: ₹{receipt.amount || receipt.total || "-"}</div>
      <Link href="/recent-receipts" className="btn-secondary">Back to Receipts</Link>
    </div>
  );
}
