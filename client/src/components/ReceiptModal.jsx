import { CheckCircle, Download, Printer, X } from 'lucide-react';
import React, { useRef } from 'react';

export default function ReceiptModal({ invoice, onClose }) {
  const receiptRef = useRef(null);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-card border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/60">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-gray-100">Sale Receipt #{invoice.invoiceNumber}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Receipt Body (Printable element) */}
        <div className="p-6 bg-gray-900/40 max-h-[70vh] overflow-y-auto">
          <div
            id="printable-receipt"
            ref={receiptRef}
            className="bg-white text-gray-900 p-6 rounded-xl shadow-inner text-sm font-sans space-y-4 max-w-sm mx-auto"
          >
            {/* Header */}
            <div className="text-center border-b border-gray-200 pb-3">
              <h2 className="font-extrabold text-xl tracking-tight text-gray-900">
                MOBILE SHOP ERP
              </h2>
              <p className="text-xs text-gray-600">Level 3, Multiplan Center, Dhaka</p>
              <p className="text-xs text-gray-600">Phone: +880 1700-000000</p>
              <div className="mt-2 text-xs font-mono font-semibold bg-gray-100 py-1 rounded">
                INVOICE: {invoice.invoiceNumber}
              </div>
            </div>

            {/* Customer info */}
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-semibold">{invoice.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone:</span>
                <span>{invoice.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span>{new Date(invoice.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cashier:</span>
                <span>{invoice.cashierUsername}</span>
              </div>
            </div>

            {/* Line items table */}
            <table className="w-full text-xs text-left border-t border-b border-gray-200 py-2">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600">
                  <th className="py-1">Item</th>
                  <th className="py-1 text-center">Qty</th>
                  <th className="py-1 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-1.5">
                      <div className="font-semibold text-gray-800">{item.productName}</div>
                      {item.imeiOrSerial && (
                        <div className="text-[10px] text-gray-500 font-mono">
                          IMEI: {item.imeiOrSerial}
                        </div>
                      )}
                    </td>
                    <td className="py-1.5 text-center font-mono">{item.qty}</td>
                    <td className="py-1.5 text-right font-mono font-semibold">
                      ৳{item.unitPrice?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals & Payments */}
            <div className="text-xs space-y-1 pt-1">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-mono">৳{invoice.subTotal?.toLocaleString()}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span className="font-mono">-৳{invoice.discount?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-gray-900 pt-2 border-t border-gray-300">
                <span>Net Total:</span>
                <span className="font-mono">৳{invoice.netTotal?.toLocaleString()}</span>
              </div>

              {/* Payment Split */}
              <div className="bg-gray-50 p-2 rounded mt-2 space-y-1 text-[11px]">
                {invoice.paymentBreakdown?.cash > 0 && (
                  <div className="flex justify-between">
                    <span>Cash Paid:</span>
                    <span className="font-mono font-semibold">
                      ৳{invoice.paymentBreakdown.cash.toLocaleString()}
                    </span>
                  </div>
                )}
                {invoice.paymentBreakdown?.bkash > 0 && (
                  <div className="flex justify-between text-pink-700">
                    <span>Bkash Paid:</span>
                    <span className="font-mono font-semibold">
                      ৳{invoice.paymentBreakdown.bkash.toLocaleString()}
                    </span>
                  </div>
                )}
                {invoice.paymentBreakdown?.dueAmount > 0 && (
                  <div className="flex justify-between text-amber-700 font-semibold">
                    <span>Customer Due:</span>
                    <span className="font-mono">
                      ৳{invoice.paymentBreakdown.dueAmount.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[10px] text-gray-500 border-t border-gray-200">
              <p className="font-semibold">Thank you for shopping with us!</p>
              <p>Warranty claims require original invoice receipt.</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t border-gray-800 bg-gray-900/80 flex items-center justify-between">
          <span className="text-xs text-gray-400">Supports Thermal (80mm) & A4</span>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-colors"
            >
              <Printer className="w-4 h-4" /> Print Thermal Receipt
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-lg text-sm transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
