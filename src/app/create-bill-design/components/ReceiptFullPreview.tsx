import React from 'react';

interface ReceiptFullPreviewProps {
  columns: Record<string, boolean>;
  elements: Record<string, boolean>;
  font: string;
  color: string;
  layout: string;
  signatureImg?: string | null;
}

// Sample data for preview
const sampleBusiness = {
  name: 'Demo Business Pvt Ltd',
  address: '123 Main Road, City, State',
  phone: '9876543210',
  email: 'demo@business.com',
  gst: '22AAAAA0000A1Z5',
  logoUrl: 'https://dummyimage.com/120x60/cccccc/222&text=LOGO'
};
const sampleCustomer = {
  name: 'John Doe',
  phone: '9999999999',
  address: '456 Customer Lane, City',
  email: 'john@example.com',
  gst: '27AABBC1234C1Z9'
};
// Fix for TS: allow dynamic string keys for sample rows
const sampleRows: Record<string, any>[] = [
  { product: 'Item 1', quantity: 2, gst: 18, price: 100, amount: 236, serial: 'A001', discount: 0 },
  { product: 'Item 2', quantity: 1, gst: 5, price: 200, amount: 210, serial: 'A002', discount: 10 }
];

function ClassicReceipt({ columns, elements, font, color, signatureImg }: ReceiptFullPreviewProps) {
  return (
    <div className="bg-white border border-gray-300 rounded-md shadow p-6" style={{ fontFamily: font, color }}>
      {elements.logo && (
        <div className="flex justify-center mb-2">
          <img src="https://dummyimage.com/120x60/cccccc/222&text=LOGO" alt="Logo" className="h-12 object-contain" />
        </div>
      )}
      {elements.businessInfo && (
        <div className="text-center mb-2">
          <div className="font-bold text-lg text-gray-900">Demo Business Pvt Ltd</div>
          <div className="text-xs">123 Main Road, City, State</div>
          <div className="text-xs">Phone: 9876543210 | Email: demo@business.com</div>
          <div className="text-xs">GSTIN: 22AAAAA0000A1Z5</div>
        </div>
      )}
      {elements.customerInfo && (
        <div className="mb-2 border-t border-b py-1 text-xs">
          <div><span className="font-semibold">Customer:</span> John Doe</div>
          <div><span className="font-semibold">Phone:</span> 9999999999 <span className="ml-4 font-semibold">GST:</span> 27AABBC1234C1Z9</div>
          <div><span className="font-semibold">Address:</span> 456 Customer Lane, City</div>
        </div>
      )}
      {elements.table && (
        <table className="w-full mb-2 border border-gray-300">
          <thead>
            <tr>
              {Object.entries(columns).filter(([_, v]) => v).map(([k]) => (
                <th key={k} className="px-2 py-1 border-b border-gray-300 bg-gray-100 text-gray-900 font-bold text-left">{k.charAt(0).toUpperCase() + k.slice(1)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                {Object.entries(columns).filter(([_, v]) => v).map(([k]) => (
                  <td key={k} className="px-2 py-1 border-b border-gray-100">{row[k] ?? ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {elements.totals && (
        <div className="flex justify-end text-sm font-semibold mb-2">
          <div>
            <div>Subtotal: ₹446</div>
            <div>GST: ₹30</div>
            <div>Total: ₹476</div>
          </div>
        </div>
      )}
      {elements.qrCode && (
        <div className="flex justify-center mb-2">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://business.com/pay" alt="QR Code" className="h-20 w-20" />
        </div>
      )}
      {elements.termsAndConditions && (
        <div className="text-xs mt-2 italic text-gray-600">Thank you for your business. All items are subject to our standard return policy.</div>
      )}
      {elements.signature && (
        <div className="mt-4 flex justify-end">
          {signatureImg ? (
            <img src={signatureImg} alt="Signature" className="h-12 border-t border-gray-300 w-40 object-contain" />
          ) : (
            <div className="italic border-t border-gray-300 w-40 text-center pt-1 text-xs">Signature</div>
          )}
        </div>
      )}
      {elements.notes && (
        <div className="mt-2 text-xs text-gray-600">Notes: Sample notes here...</div>
      )}
    </div>
  );
}

function ModernReceipt({ columns, elements, font, color, signatureImg }: ReceiptFullPreviewProps) {
  return (
    <div className="bg-white border-l-8 border-gray-300 rounded-xl shadow-xl p-8" style={{ fontFamily: font, color }}>
      <div className="flex items-center mb-2">
        {elements.logo && <img src="https://dummyimage.com/60x60/cccccc/222&text=LOGO" alt="Logo" className="h-10 w-10 object-contain mr-4" />}
        {elements.businessInfo && <div className="font-extrabold text-2xl text-gray-900">Demo Business Pvt Ltd</div>}
      </div>
      {elements.customerInfo && (
        <div className="mb-2 text-xs flex gap-8">
          <div><span className="font-semibold">Customer:</span> John Doe</div>
          <div><span className="font-semibold">Phone:</span> 9999999999</div>
          <div><span className="font-semibold">GST:</span> 27AABBC1234C1Z9</div>
        </div>
      )}
      {elements.table && (
        <table className="w-full mb-2 shadow border-0">
          <thead>
            <tr>
              {Object.entries(columns).filter(([_, v]) => v).map(([k]) => (
                <th key={k} className="px-2 py-2 bg-gray-100 text-gray-900 font-bold text-left uppercase tracking-wide">{k.charAt(0).toUpperCase() + k.slice(1)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                {Object.entries(columns).filter(([_, v]) => v).map(([k]) => (
                  <td key={k} className="px-2 py-2 text-gray-900 font-medium">{row[k] ?? ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {elements.totals && (
        <div className="flex justify-end text-base font-bold text-gray-900 mb-2">
          <div>
            <div>Subtotal: ₹446</div>
            <div>GST: ₹30</div>
            <div>Total: ₹476</div>
          </div>
        </div>
      )}
      {elements.qrCode && (
        <div className="flex justify-end mb-2">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://business.com/pay" alt="QR Code" className="h-20 w-20" />
        </div>
      )}
      {elements.termsAndConditions && (
        <div className="text-xs mt-2 italic text-gray-600">Thank you for your business. All items are subject to our standard return policy.</div>
      )}
      {elements.signature && (
        <div className="mt-4 flex justify-end">
          {signatureImg ? (
            <img src={signatureImg} alt="Signature" className="h-10 border-t-2 border-gray-300 w-32 object-contain" />
          ) : (
            <div className="italic border-t-2 border-gray-300 w-32 text-center pt-1 text-xs">Signature</div>
          )}
        </div>
      )}
      {elements.notes && (
        <div className="mt-2 text-xs text-gray-900">Notes: Sample notes here...</div>
      )}
    </div>
  );
}

function CompactReceipt({ columns, elements, font, color, signatureImg }: ReceiptFullPreviewProps) {
  return (
    <div className="bg-white border border-gray-300 rounded p-3 text-xs" style={{ fontFamily: font, color }}>
      {elements.logo && (
        <img src="https://dummyimage.com/40x20/cccccc/222&text=LOGO" alt="Logo" className="h-6 object-contain mx-auto mb-1" />
      )}
      {elements.businessInfo && (
        <div className="text-center mb-1 font-bold text-gray-900">Demo Business Pvt Ltd</div>
      )}
      {elements.customerInfo && (
        <div className="mb-1 border-t border-b py-1 text-xxs">
          <div><span className="font-semibold">Cust:</span> John Doe</div>
          <div><span className="font-semibold">Ph:</span> 9999999999 <span className="ml-2 font-semibold">GST:</span> 27AABBC1234C1Z9</div>
        </div>
      )}
      {elements.table && (
        <table className="w-full mb-1 border border-gray-200 text-xxs">
          <thead>
            <tr>
              {Object.entries(columns).filter(([_, v]) => v).map(([k]) => (
                <th key={k} className="px-1 py-1 border-b border-gray-200 bg-gray-100 text-gray-900 font-semibold text-left text-xxs">{k.charAt(0).toUpperCase() + k.slice(1)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-gray-100' : ''}>
                {Object.entries(columns).filter(([_, v]) => v).map(([k]) => (
                  <td key={k} className="px-1 py-1 border-b border-gray-100 text-xxs">{row[k] ?? ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {elements.totals && (
        <div className="flex justify-end text-xs font-semibold mb-1">
          <div>
            <div>Subtotal: ₹446</div>
            <div>GST: ₹30</div>
            <div>Total: ₹476</div>
          </div>
        </div>
      )}
      {elements.signature && (
        <div className="mt-2 flex justify-end">
          {signatureImg ? (
            <img src={signatureImg} alt="Signature" className="h-6 border-t border-gray-300 w-24 object-contain" />
          ) : (
            <div className="italic border-t border-gray-300 w-24 text-center pt-1 text-xxs">Signature</div>
          )}
        </div>
      )}
    </div>
  );
}

function ElegantReceipt({ columns, elements, font, color, signatureImg }: ReceiptFullPreviewProps) {
  return (
    <div className="bg-white border border-gray-400 rounded-2xl shadow-lg p-8 font-serif" style={{ fontFamily: font, color }}>
      {elements.logo && (
        <div className="flex justify-center mb-2">
          <img src="https://dummyimage.com/100x40/cccccc/222&text=LOGO" alt="Logo" className="h-10 object-contain" />
        </div>
      )}
      {elements.businessInfo && (
        <div className="text-center mb-2 italic text-gray-900 text-xl font-semibold">Demo Business Pvt Ltd</div>
      )}
      {elements.customerInfo && (
        <div className="mb-2 border-t border-b py-1 text-xs italic">
          <div>Customer: John Doe</div>
          <div>Phone: 9999999999 | GST: 27AABBC1234C1Z9</div>
        </div>
      )}
      {elements.table && (
        <table className="w-full mb-2 border border-gray-300">
          <thead>
            <tr>
              {Object.entries(columns).filter(([_, v]) => v).map(([k]) => (
                <th key={k} className="px-2 py-1 border-b border-gray-300 bg-gray-100 text-gray-900 font-semibold italic text-left">{k.charAt(0).toUpperCase() + k.slice(1)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                {Object.entries(columns).filter(([_, v]) => v).map(([k]) => (
                  <td key={k} className="px-2 py-1 border-b border-gray-100 italic">{row[k] ?? ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {elements.totals && (
        <div className="flex justify-end text-base font-semibold text-gray-900 mb-2 italic">
          <div>
            <div>Subtotal: ₹446</div>
            <div>GST: ₹30</div>
            <div>Total: ₹476</div>
          </div>
        </div>
      )}
      {elements.signature && (
        <div className="mt-6 flex justify-end">
          {signatureImg ? (
            <img src={signatureImg} alt="Signature" className="h-10 border-t border-gray-400 w-32 object-contain" />
          ) : (
            <div className="italic border-t border-gray-400 w-32 text-center pt-1 text-xs">Signature</div>
          )}
        </div>
      )}
    </div>
  );
}

function BoldReceipt({ columns, elements, font, color, signatureImg }: ReceiptFullPreviewProps) {
  return (
    <div className="bg-white border-4 border-gray-800 rounded-lg shadow-lg p-6" style={{ fontFamily: font, color }}>
      <div className="flex items-center gap-4 mb-2">
        {elements.logo && <img src="https://dummyimage.com/60x60/cccccc/222&text=LOGO" alt="Logo" className="h-12 w-12 object-contain" />}
        {elements.businessInfo && <div className="font-black text-2xl text-gray-800">Demo Business Pvt Ltd</div>}
      </div>
      {elements.customerInfo && (
        <div className="mb-2 text-xs flex gap-8">
          <div><span className="font-semibold">Customer:</span> John Doe</div>
          <div><span className="font-semibold">Phone:</span> 9999999999</div>
          <div><span className="font-semibold">GST:</span> 27AABBC1234C1Z9</div>
        </div>
      )}
      {elements.table && (
        <table className="w-full mb-2 border-2 border-gray-800">
          <thead>
            <tr>
              {Object.entries(columns).filter(([_, v]) => v).map(([k]) => (
                <th key={k} className="px-2 py-2 bg-gray-100 text-gray-800 font-black text-left uppercase tracking-wide border-b-2 border-gray-800">{k.charAt(0).toUpperCase() + k.slice(1)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-gray-100' : ''}>
                {Object.entries(columns).filter(([_, v]) => v).map(([k]) => (
                  <td key={k} className="px-2 py-2 border-b-2 border-gray-800 font-bold">{row[k] ?? ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {elements.totals && (
        <div className="flex justify-end text-lg font-black text-gray-800 mb-2">
          <div>
            <div>Subtotal: ₹446</div>
            <div>GST: ₹30</div>
            <div>Total: ₹476</div>
          </div>
        </div>
      )}
      {elements.signature && (
        <div className="mt-6 flex justify-end">
          {signatureImg ? (
            <img src={signatureImg} alt="Signature" className="h-12 border-t-2 border-gray-800 w-40 object-contain" />
          ) : (
            <div className="italic border-t-2 border-gray-800 w-40 text-center pt-1 text-xs">Signature</div>
          )}
        </div>
      )}
    </div>
  );
}

function MinimalReceipt({ columns, elements, font, color, signatureImg }: ReceiptFullPreviewProps) {
  return (
    <div className="bg-white text-gray-700 p-4" style={{ fontFamily: font, color }}>
      <div className="flex items-center gap-2 mb-1">
        {elements.logo && <img src="https://dummyimage.com/40x20/cccccc/222&text=LOGO" alt="Logo" className="h-6 object-contain" />}
        {elements.businessInfo && <div className="font-semibold text-base">Demo Business Pvt Ltd</div>}
      </div>
      {elements.customerInfo && (
        <div className="mb-1 border-b pb-1 text-xs">
          <span>Customer: John Doe</span> | <span>Ph: 9999999999</span> | <span>GST: 27AABBC1234C1Z9</span>
        </div>
      )}
      {elements.table && (
        <table className="w-full mb-1 text-xs">
          <thead>
            <tr>
              {Object.entries(columns).filter(([_, v]) => v).map(([k]) => (
                <th key={k} className="px-1 py-1 bg-gray-200 text-gray-700 font-semibold text-left text-xs">{k.charAt(0).toUpperCase() + k.slice(1)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-gray-100' : ''}>
                {Object.entries(columns).filter(([_, v]) => v).map(([k]) => (
                  <td key={k} className="px-1 py-1 text-xs">{row[k] ?? ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {elements.totals && (
        <div className="flex justify-end text-xs font-semibold mb-1">
          <div>
            <div>Subtotal: ₹446</div>
            <div>GST: ₹30</div>
            <div>Total: ₹476</div>
          </div>
        </div>
      )}
      {elements.signature && (
        <div className="mt-2 flex justify-end">
          {signatureImg ? (
            <img src={signatureImg} alt="Signature" className="h-6 border-t border-gray-400 w-24 object-contain" />
          ) : (
            <div className="italic border-t border-gray-400 w-24 text-center pt-1 text-xs">Signature</div>
          )}
        </div>
      )}
    </div>
  );
}

function ThermalReceipt({ columns, elements, font, color, signatureImg }: ReceiptFullPreviewProps) {
  return (
    <div
      className="bg-white border border-gray-300 rounded-none shadow-none p-4 mx-auto"
      style={{ fontFamily: 'monospace', color: '#222', maxWidth: 340, minWidth: 260 }}
    >
      {elements.logo && (
        <div className="flex justify-center mb-2">
          <img src="https://dummyimage.com/100x40/cccccc/222&text=LOGO" alt="Logo" className="h-10 object-contain" />
        </div>
      )}
      {elements.businessInfo && (
        <div className="text-center mb-1">
          <div className="font-bold text-base tracking-widest">Demo Shop</div>
          <div className="text-xs">123 Market Road, City</div>
          <div className="text-xs">Ph: 9876543210</div>
        </div>
      )}
      <div className="flex justify-between text-xs border-b border-dashed border-gray-400 py-1 mb-1">
        <span>Date: 29/04/2025</span>
        <span>Time: 16:54</span>
      </div>
      {elements.customerInfo && (
        <div className="mb-1 text-xs">
          <span className="font-semibold">Cust:</span> John Doe | <span>Ph:</span> 9999999999
        </div>
      )}
      {elements.table && (
        <table className="w-full text-xs mb-1">
          <thead>
            <tr>
              {Object.entries(columns).filter(([_, v]) => v).map(([k]) => (
                <th key={k} className="py-1 border-b border-dashed border-gray-400 text-left font-bold tracking-wide">{k.charAt(0).toUpperCase() + k.slice(1)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((row, i) => (
              <tr key={i}>
                {Object.entries(columns).filter(([_, v]) => v).map(([k]) => (
                  <td key={k} className="py-1 border-b border-dashed border-gray-200">{row[k] ?? ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {elements.totals && (
        <div className="text-xs font-bold border-t border-dashed border-gray-400 pt-1 mb-1">
          <div>Subtotal: ₹446</div>
          <div>GST: ₹30</div>
          <div>Total: ₹476</div>
        </div>
      )}
      {elements.termsAndConditions && (
        <div className="text-[10px] text-center italic mt-2 text-gray-600">Thank you for shopping with us!</div>
      )}
      {elements.signature && (
        <div className="mt-2 flex justify-end">
          {signatureImg ? (
            <img src={signatureImg} alt="Signature" className="h-8 border-t border-gray-400 w-24 object-contain" />
          ) : (
            <div className="italic border-t border-gray-400 w-24 text-center pt-1 text-[10px]">Signature</div>
          )}
        </div>
      )}
      {elements.notes && (
        <div className="mt-2 text-[10px] text-gray-600">Notes: Sample notes here...</div>
      )}
    </div>
  );
}

export default function ReceiptFullPreview(props: ReceiptFullPreviewProps) {
  switch (props.layout) {
    case 'classic':
      return <ClassicReceipt {...props} />;
    case 'modern':
      return <ModernReceipt {...props} />;
    case 'compact':
      return <CompactReceipt {...props} />;
    case 'elegant':
      return <ElegantReceipt {...props} />;
    case 'bold':
      return <BoldReceipt {...props} />;
    case 'minimal':
      return <MinimalReceipt {...props} />;
    case 'thermal':
      return <ThermalReceipt {...props} />;
    default:
      return <ClassicReceipt {...props} />;
  }
}
