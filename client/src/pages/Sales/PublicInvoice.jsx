import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import {
  Printer,
  Maximize,
  Minimize,
  Smartphone,
  FileText,
  Download,
  AlertCircle,
} from 'lucide-react';
import axios from 'axios';
import {
  InvoiceA4Full,
  InvoiceA4Half,
  InvoiceReceipt,
  InvoiceThermal,
} from '../../components/sales/Invoice';
import { Button } from '../../components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const INVOICE_SIZES = [
  { key: 'a4', label: 'A4 Full', icon: Maximize },
  { key: 'a4half', label: 'A4 Half', icon: FileText },
  { key: 'receipt', label: 'Receipt', icon: Minimize },
  { key: 'thermal', label: 'Thermal', icon: Smartphone },
];

export default function PublicInvoice() {
  const { token } = useParams();
  const printRef = useRef(null);
  const [printSize, setPrintSize] = useState('a4');

  const {
    data: sale,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['publicInvoice', token],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/sales/public/${token}`);
      return res.data?.data;
    },
    enabled: !!token,
    retry: false,
  });

  const getPageStyle = () => {
    switch (printSize) {
      case 'a4half':
        return `@page { size: A5 portrait; margin: 0; } @media print { html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`;
      case 'receipt':
        return `@page { size: 80mm auto; margin: 0; } @media print { html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`;
      case 'thermal':
        return `@page { size: 58mm auto; margin: 0; } @media print { html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`;
      default:
        return `@page { size: A4 portrait; margin: 0; } @media print { html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`;
    }
  };

  const handlePrint = () => {
    const style = document.createElement('style');
    style.id = 'print-style';
    style.textContent = getPageStyle();
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  const renderInvoice = () => {
    switch (printSize) {
      case 'a4half':
        return <InvoiceA4Half sale={sale} />;
      case 'receipt':
        return <InvoiceReceipt sale={sale} />;
      case 'thermal':
        return <InvoiceThermal sale={sale} />;
      default:
        return <InvoiceA4Full sale={sale} />;
    }
  };

  const getWidth = () => {
    switch (printSize) {
      case 'receipt':
        return 'max-w-[80mm]';
      case 'thermal':
        return 'max-w-[58mm]';
      default:
        return 'max-w-[210mm]';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-4">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Invoice Not Found
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {error?.response?.data?.message || 'This invoice link is invalid or has expired.'}
          </p>
        </div>
      </div>
    );
  }

  if (!sale) return null;

  const paid =
    (sale.paymentBreakdown?.cash || 0) +
    (sale.paymentBreakdown?.bkash || 0) +
    (sale.paymentBreakdown?.rocket || 0) +
    (sale.paymentBreakdown?.nagad || 0) +
    (sale.paymentBreakdown?.bank || 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Invoice {sale.invoiceNumber}
            </h1>
            <p className="text-xs text-gray-500">
              {new Date(sale.createdAt).toLocaleString('en-BD')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {INVOICE_SIZES.map((size) => (
                <button
                  key={size.key}
                  onClick={() => setPrintSize(size.key)}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                    printSize === size.key
                      ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-gray-100'
                      : 'text-gray-500'
                  }`}
                >
                  <size.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{size.label}</span>
                </button>
              ))}
            </div>
            <Button onClick={handlePrint} size="sm" className="gap-2">
              <Printer className="w-4 h-4" /> Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const { downloadBackendInvoicePdf } = await import('../../utils/invoiceGenerator');
                downloadBackendInvoicePdf(sale._id, sale.invoiceNumber);
              }}
              className="gap-2"
            >
              <Download className="w-4 h-4" /> PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Grand Total</div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
              ৳{sale.netTotal?.toLocaleString()}
            </div>
          </div>
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Paid</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              ৳{paid.toLocaleString()}
            </div>
          </div>
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Due</div>
            <div
              className={`text-xl font-bold ${
                sale.paymentBreakdown?.dueAmount > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-400'
              }`}
            >
              ৳{sale.paymentBreakdown?.dueAmount?.toLocaleString() || 0}
            </div>
          </div>
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Customer</div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {sale.customerName}
            </div>
            <div className="text-xs text-gray-500">{sale.customerPhone}</div>
          </div>
        </div>
      </div>

      {/* Invoice Renderer */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="bg-gray-200 dark:bg-gray-900 rounded-xl p-4 flex justify-center overflow-x-auto">
          <div ref={printRef} className={`${getWidth()} flex-shrink-0 printable-invoice-container`}>
            {renderInvoice()}
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          This invoice was shared via a secure link. Generated on{' '}
          {new Date().toLocaleDateString('en-BD')}.
        </p>
      </div>
    </div>
  );
}
