import React from 'react';

export type ReceiptTemplateOption = {
  id: string;
  name: string;
  description: string;
  previewClass: string; // Tailwind classes for preview
};

export const RECEIPT_TEMPLATES: ReceiptTemplateOption[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional receipt with clear borders and business branding.',
    previewClass: 'border border-gray-400 bg-white',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Minimal, clean, and large headings with accent color.',
    previewClass: 'border-l-8 border-primary-600 bg-gray-50',
  },
  {
    id: 'colorful',
    name: 'Colorful',
    description: 'Bright header with bold colors and rounded corners.',
    previewClass: 'bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl',
  }
];

export function ReceiptTemplatePreview({ template, selected, onClick }: {
  template: ReceiptTemplateOption;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`p-4 cursor-pointer flex flex-col items-center justify-center mb-2 shadow-sm hover:shadow-lg transition-all duration-200 ${template.previewClass} ${selected ? 'ring-4 ring-primary-400' : ''}`}
      onClick={onClick}
      title={template.description}
    >
      <div className="font-bold text-lg mb-2">{template.name}</div>
      <div className="text-xs opacity-80 text-center">{template.description}</div>
    </div>
  );
}
