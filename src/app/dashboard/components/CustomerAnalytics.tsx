import React, { useState, useMemo } from 'react';

// Helper: group receipts by customer
function groupByCustomer(receipts: any[]) {
  const map: Record<string, any[]> = {};
  receipts.forEach(r => {
    const cid = r.customer_id || r.customerId || 'Unknown';
    if (!map[cid]) map[cid] = [];
    map[cid].push(r);
  });
  return map;
}

// Helper: get product stats for a customer
function getProductStats(receipts: any[]) {
  const stats: Record<string, number> = {};
  receipts.forEach(r => {
    let products = r.products;
    if (typeof products === 'string') {
      try { products = JSON.parse(products); } catch {}
    }
    (products || []).forEach((p: any) => {
      stats[p.name] = (stats[p.name] || 0) + (p.quantity || 1);
    });
  });
  return stats;
}

export default function CustomerAnalytics({ receipts }: { receipts: any[] }) {
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const customers = useMemo(() => Object.keys(groupByCustomer(receipts)), [receipts]);
  const grouped = useMemo(() => groupByCustomer(receipts), [receipts]);
  const selectedReceipts = selectedCustomer ? grouped[selectedCustomer] || [] : [];
  const productStats = getProductStats(selectedReceipts);
  const totalRemaining = selectedReceipts.reduce((sum, r) => sum + (r.amount_remaining || 0), 0);

  // New Features
  // 1. Total amount spent
  const totalSpent = selectedReceipts.reduce((sum, r) => sum + (r.amount_paid || 0), 0);
  // 2. First and last purchase date
  const sortedDates = selectedReceipts.map(r => new Date(r.date)).sort((a, b) => a.getTime() - b.getTime());
  const firstPurchase = sortedDates[0] ? sortedDates[0].toLocaleDateString() : '-';
  const lastPurchase = sortedDates[sortedDates.length-1] ? sortedDates[sortedDates.length-1].toLocaleDateString() : '-';
  // 3. Most frequently purchased product
  let mostFrequentProduct = '-';
  if (Object.keys(productStats).length > 0) {
    mostFrequentProduct = Object.entries(productStats).sort((a,b) => b[1]-a[1])[0][0];
  }
  // 4. Average bill value
  const avgBillValue = selectedReceipts.length > 0 ? (selectedReceipts.reduce((sum, r) => sum + (r.total || 0), 0) / selectedReceipts.length).toFixed(2) : '-';

  return (
    <div>
      <div className="mb-4">
        <label className="block font-medium mb-1">Select Customer:</label>
        <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} className="border rounded px-3 py-2 w-full">
          <option value="">-- Choose --</option>
          {customers.map(cid => (
            <option key={cid} value={cid}>{cid}</option>
          ))}
        </select>
      </div>
      {selectedCustomer && (
        <>
          {/* Customer Summary Section */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded p-4">
            <div><span className="font-semibold">Total Spent:</span> ₹{totalSpent.toLocaleString('en-IN')}</div>
            <div><span className="font-semibold">Total Remaining:</span> ₹{totalRemaining.toLocaleString('en-IN')}</div>
            <div><span className="font-semibold">First Purchase:</span> {firstPurchase}</div>
            <div><span className="font-semibold">Last Purchase:</span> {lastPurchase}</div>
            <div><span className="font-semibold">Most Frequent Product:</span> {mostFrequentProduct}</div>
            <div><span className="font-semibold">Average Bill Value:</span> ₹{avgBillValue}</div>
          </div>
          <div className="mb-4">
            <h4 className="font-semibold mb-2">All Bills Issued</h4>
            <ul className="list-disc ml-6">
              {selectedReceipts.map((r, i) => (
                <li key={r.id || r.receipt_id || i}>
                  Receipt #{r.receipt_number || r.id} | Date: {r.date} | Total: ₹{r.total} | Paid: ₹{r.amount_paid || 0} | Remaining: ₹{r.amount_remaining || 0}
                </li>
              ))}
            </ul>
          </div>
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Products Purchased (Quantity)</h4>
            <div className="w-full h-48 bg-gray-100 rounded flex items-end gap-2 p-4">
              {Object.entries(productStats).map(([prod, qty]) => (
                <div key={prod} className="flex flex-col items-center justify-end">
                  <div className="bg-primary-500 text-white px-2 rounded-t" style={{height: Math.max(10, Number(qty) * 10)}}>{qty}</div>
                  <div className="text-xs mt-1">{prod}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Money Remaining to Pay</h4>
            <div className="text-lg font-bold text-red-600">₹{totalRemaining.toLocaleString('en-IN')}</div>
          </div>
        </>
      )}
    </div>
  );
}
