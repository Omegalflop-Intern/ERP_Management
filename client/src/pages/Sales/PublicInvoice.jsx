import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  AlertCircle,
  Download,
  FileText,
  Maximize,
  Minimize,
  Printer,
  Smartphone,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
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
  const [pdfDownloading, setPdfDownloading] = useState(false);

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

  const handleDownloadPdf = async () => {
    setPdfDownloading(true);
    try {
      const { downloadBackendInvoicePdf, generateA4Invoice } = await import(
        '../../utils/invoiceGenerator'
      );
      const success = await downloadBackendInvoicePdf(token || sale._id, sale.invoiceNumber);
      if (!success && sale) {
        // Fallback to instant client-side PDF capture
        await generateA4Invoice(sale, printRef.current);
      }
    } catch (e) {
      console.error('PDF download error:', e);
    } finally {
      setPdfDownloading(false);
    }
  };

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-4 text-center">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse mx-auto" />
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Invoice Not Found
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 rounded-md">
                Official Invoice
              </span>
              <h1 className="text-base font-bold text-slate-900 dark:text-white">
                #{sale.invoiceNumber}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Issued on {new Date(sale.createdAt).toLocaleString('en-BD')}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Size Switchers */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
              {INVOICE_SIZES.map((size) => (
                <button
                  key={size.key}
                  onClick={() => setPrintSize(size.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    printSize === size.key
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <size.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{size.label}</span>
                </button>
              ))}
            </div>

            <Button
              onClick={handlePrint}
              size="sm"
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm text-xs font-bold"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pdfDownloading}
              onClick={handleDownloadPdf}
              className="gap-1.5 rounded-xl border-slate-300 dark:border-slate-700 text-xs font-bold"
            >
              <Download className="w-3.5 h-3.5" /> {pdfDownloading ? 'Downloading...' : 'PDF'}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Grand Total
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              ৳{sale.netTotal?.toLocaleString()}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Paid Amount
            </div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ৳{paid.toLocaleString()}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Balance Due
            </div>
            <div
              className={`text-xl font-black mt-1 ${
                sale.paymentBreakdown?.dueAmount > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              ৳{sale.paymentBreakdown?.dueAmount?.toLocaleString() || 0}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Customer
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white truncate mt-1">
              {sale.customerName || 'Walk-in Customer'}
            </div>
            <div className="text-xs text-slate-400">{sale.customerPhone || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Invoice Document Preview Container */}
      <div className="max-w-6xl mx-auto px-4 py-4 pb-12">
        <div className="bg-slate-200/70 dark:bg-slate-900/60 rounded-3xl p-4 sm:p-8 flex justify-center overflow-x-auto border border-slate-300/60 dark:border-slate-800 shadow-inner">
          <div
            ref={printRef}
            className={`${getWidth()} flex-shrink-0 printable-invoice-container shadow-2xl rounded-lg overflow-hidden`}
          >
            {renderInvoice()}
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
          This digital invoice was verified and shared via a secure link. Generated on{' '}
          {new Date().toLocaleDateString('en-BD')}.
        </p>
      </div>
    </div>
  );
}
