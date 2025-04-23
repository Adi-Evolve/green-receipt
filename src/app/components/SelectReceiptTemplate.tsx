import React from 'react';
import { RECEIPT_TEMPLATES, ReceiptTemplatePreview, ReceiptTemplateOption } from './ReceiptTemplates';

export default function SelectReceiptTemplate({ selected, setSelected }: {
  selected: string;
  setSelected: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 font-semibold">Choose a receipt template:</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {RECEIPT_TEMPLATES.map((tmpl) => (
          <ReceiptTemplatePreview
            key={tmpl.id}
            template={tmpl}
            selected={selected === tmpl.id}
            onClick={() => setSelected(tmpl.id)}
          />
        ))}
      </div>
    </div>
  );
}
