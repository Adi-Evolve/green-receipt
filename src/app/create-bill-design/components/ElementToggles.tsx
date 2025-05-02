import React from 'react';

interface ElementTogglesProps {
  elements: Record<string, boolean>;
  setElements: (els: Record<string, boolean>) => void;
}

const ELEMENTS = [
  { key: 'logo', label: 'Logo' },
  { key: 'businessInfo', label: 'Business Info' },
  { key: 'customerInfo', label: 'Customer Info' },
  { key: 'table', label: 'Table' },
  { key: 'totals', label: 'Totals' },
  { key: 'qrCode', label: 'QR Code' },
  { key: 'termsAndConditions', label: 'Terms & Conditions' },
  { key: 'warranty', label: 'Warranty' },
  { key: 'returnPeriod', label: 'Return Period' },
  { key: 'signature', label: 'Signature' },
  { key: 'notes', label: 'Notes' }
];

export default function ElementToggles({ elements, setElements }: ElementTogglesProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {ELEMENTS.map(({ key, label }) => (
        <label key={key} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!elements[key]}
            onChange={() => setElements({ ...elements, [key]: !elements[key] })}
          />
          {label}
        </label>
      ))}
    </div>
  );
}
