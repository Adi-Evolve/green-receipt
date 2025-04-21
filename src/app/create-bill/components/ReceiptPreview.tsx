"use client";

import QRCode from 'qrcode.react';

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  gst: number;
  amount: number;
}

interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  gst: string;
  businessId: string;
}

interface ReceiptData {
  receiptNumber: string;
  customerName: string;
  customerPhone: string;
  customerId: string;
  date: string;
  products: Product[];
  subtotal: number;
  gstTotal: number;
  total: number;
  termsAndConditions: string;
  warrantyDays: number;
  returnDays: number;
  businessInfo: BusinessInfo;
}

interface ElementsState {
  logo: boolean;
  businessInfo: boolean;
  customerInfo: boolean;
  termsAndConditions: boolean;
  warranty: boolean;
  qrCode: boolean;
}

interface ColumnsState {
  product: boolean;
  quantity: boolean;
  gst: boolean;
  price: boolean;
  amount: boolean;
}

interface ReceiptPreviewProps {
  receipt: ReceiptData;
  elements: ElementsState;
  columns: ColumnsState;
}

const ReceiptPreview = ({ receipt, elements, columns }: ReceiptPreviewProps) => {
  // Generate QR code value
  const qrValue = JSON.stringify({
    receipt: receipt.receiptNumber,
    business: receipt.businessInfo.name,
    businessId: receipt.businessInfo.businessId,
    customer: receipt.customerName,
    total: receipt.total.toFixed(2),
    date: receipt.date
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm print:shadow-none print:border-none">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          {elements.logo && (
            <div className="flex items-center">
              <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-bold text-2xl">GR</span>
              </div>
            </div>
          )}
          
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-900">RECEIPT</h1>
            <p className="text-gray-600">#{receipt.receiptNumber}</p>
            <p className="text-gray-600">{receipt.date}</p>
          </div>
        </div>
        
        {/* Business & Customer Information */}
        <div className="flex flex-col md:flex-row justify-between mb-8 gap-6">
          {elements.businessInfo && (
            <div>
              <h2 className="font-bold text-gray-900 mb-2">From</h2>
              <p className="font-semibold">{receipt.businessInfo.name}</p>
              <p className="text-gray-600">{receipt.businessInfo.address}</p>
              <p className="text-gray-600">Phone: {receipt.businessInfo.phone}</p>
              <p className="text-gray-600">Email: {receipt.businessInfo.email}</p>
              <p className="text-gray-600">GST: {receipt.businessInfo.gst}</p>
              <p className="text-gray-600">Business ID: {receipt.businessInfo.businessId}</p>
            </div>
          )}
          
          {elements.customerInfo && receipt.customerName && (
            <div>
              <h2 className="font-bold text-gray-900 mb-2">To</h2>
              <p className="font-semibold">{receipt.customerName}</p>
              {receipt.customerPhone && <p className="text-gray-600">Phone: {receipt.customerPhone}</p>}
              {receipt.customerId && <p className="text-gray-600">Customer ID: {receipt.customerId}</p>}
            </div>
          )}
        </div>
        
        {/* Products Table */}
        <div className="mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                {columns.product && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                )}
                {columns.quantity && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                )}
                {columns.price && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                )}
                {columns.gst && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GST %
                  </th>
                )}
                {columns.amount && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {receipt.products.map((product, index) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  {columns.product && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name || 'Unnamed Product'}
                    </td>
                  )}
                  {columns.quantity && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.quantity}
                    </td>
                  )}
                  {columns.price && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{product.price.toFixed(2)}
                    </td>
                  )}
                  {columns.gst && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.gst}%
                    </td>
                  )}
                  {columns.amount && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{product.amount.toFixed(2)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={columns.product ? 2 : 1} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                  Subtotal:
                </td>
                <td colSpan={columns.quantity ? 1 : 0} className="px-6 py-4"></td>
                <td colSpan={columns.price ? 1 : 0} className="px-6 py-4"></td>
                <td colSpan={columns.gst ? 1 : 0} className="px-6 py-4"></td>
                <td colSpan={columns.amount ? 1 : 0} className="px-6 py-4 text-sm text-gray-900">
                  ₹{receipt.subtotal.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={columns.product ? 2 : 1} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                  GST:
                </td>
                <td colSpan={columns.quantity ? 1 : 0} className="px-6 py-4"></td>
                <td colSpan={columns.price ? 1 : 0} className="px-6 py-4"></td>
                <td colSpan={columns.gst ? 1 : 0} className="px-6 py-4"></td>
                <td colSpan={columns.amount ? 1 : 0} className="px-6 py-4 text-sm text-gray-900">
                  ₹{receipt.gstTotal.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={columns.product ? 2 : 1} className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                  Total:
                </td>
                <td colSpan={columns.quantity ? 1 : 0} className="px-6 py-4"></td>
                <td colSpan={columns.price ? 1 : 0} className="px-6 py-4"></td>
                <td colSpan={columns.gst ? 1 : 0} className="px-6 py-4"></td>
                <td colSpan={columns.amount ? 1 : 0} className="px-6 py-4 text-lg font-bold text-gray-900">
                  ₹{receipt.total.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* Terms, Warranty, and QR code */}
        <div className="border-t border-gray-200 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {elements.termsAndConditions && receipt.termsAndConditions && (
                <div className="mb-4">
                  <h3 className="text-sm font-bold uppercase text-gray-700 mb-2">Terms and Conditions</h3>
                  <p className="text-sm text-gray-600">{receipt.termsAndConditions}</p>
                </div>
              )}
              
              {elements.warranty && (receipt.warrantyDays > 0 || receipt.returnDays > 0) && (
                <div>
                  <h3 className="text-sm font-bold uppercase text-gray-700 mb-2">Warranty & Return Policy</h3>
                  {receipt.warrantyDays > 0 && (
                    <p className="text-sm text-gray-600">Warranty: {receipt.warrantyDays} days</p>
                  )}
                  {receipt.returnDays > 0 && (
                    <p className="text-sm text-gray-600">Return: {receipt.returnDays} days</p>
                  )}
                </div>
              )}
            </div>
            
            {elements.qrCode && (
              <div className="flex justify-center md:justify-end">
                <div className="p-2 bg-white border border-gray-200 rounded-md">
                  <QRCode value={qrValue} size={120} />
                  <p className="text-xs text-center text-gray-500 mt-2">Scan for digital receipt</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>Thank you for your business!</p>
          <p className="mt-1">This is a computer-generated receipt. No signature is required.</p>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreview; 