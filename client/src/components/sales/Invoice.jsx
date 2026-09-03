import { useQuery } from '@tanstack/react-query';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import React, { useEffect, useRef, useState } from 'react';
import api from '../../lib/api';

export function numberToWordsBD(num) {
  if (num === null || num === undefined || isNaN(num)) return '';
  num = Math.floor(Math.abs(num));
  if (num === 0) return 'Taka Zero Only';

  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const double = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const convertTwoDigits = (n) => {
    if (n < 10) return single[n];
    if (n < 20) return double[n - 10];
    const t = Math.floor(n / 10);
    const r = n % 10;
    return tens[t] + (r > 0 ? ' ' + single[r] : '');
  };

  const convertThreeDigits = (n) => {
    const h = Math.floor(n / 100);
    const r = n % 100;
    let str = '';
    if (h > 0) str += single[h] + ' Hundred';
    if (r > 0) str += (str ? ' ' : '') + convertTwoDigits(r);
    return str;
  };

  let words = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = num;

  if (crore > 0) words += (words ? ' ' : '') + convertThreeDigits(crore) + ' Crore';
  if (lakh > 0) words += (words ? ' ' : '') + convertTwoDigits(lakh) + ' Lakh';
  if (thousand > 0) words += (words ? ' ' : '') + convertTwoDigits(thousand) + ' Thousand';
  if (hundred > 0) words += (words ? ' ' : '') + convertThreeDigits(hundred);

  return words ? `Taka ${words} Only` : 'Taka Zero Only';
}

export function BarcodeCanvas({ value, width = 1.4, height = 32, displayValue = true }) {
  const svgRef = useRef(null);
  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue,
          fontSize: 10,
          font: 'monospace',
          margin: 2,
          background: 'transparent',
          lineColor: '#0F172A',
        });
      } catch (err) {
        console.error('Barcode generation error:', err);
      }
    }
  }, [value, width, height, displayValue]);
  return <svg ref={svgRef} className="max-w-full h-auto" />;
}

export const BarcodeSVG = BarcodeCanvas;

export function QRCodeCanvas({ value, size = 64 }) {
  const [svgHtml, setSvgHtml] = useState('');

  useEffect(() => {
    if (value) {
      QRCode.toString(value, {
        type: 'svg',
        margin: 1,
        width: size,
        errorCorrectionLevel: 'M',
        color: { dark: '#0F172A', light: '#FFFFFF' },
      })
        .then((svg) => setSvgHtml(svg))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [value, size]);

  if (!svgHtml) return <div style={{ width: size, height: size }} />;

  return (
    <div
      className="inline-block flex-shrink-0 leading-none"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}

export const QRCodeSVG = QRCodeCanvas;

export const fallbackCompanyInfo = {
  name: 'OMNI-MANAGE',
  slogan: 'Your Trusted Gadget & Electronics Partner',
  address: 'Level 3, Shop 304, Multiplan Center, New Elephant Road, Dhaka-1205',
  phone: '+880 1700-000000, +880 1800-000000',
  email: 'sales@omnimanage.bd',
  binVat: '',
  invoiceFooter: 'Thank you for shopping with us!',
};

export const companyInfo = fallbackCompanyInfo;

import { getAssetUrl } from '../../lib/api';

export function useCompanyInfo() {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data?.data || {};
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    name: settings?.companyName || fallbackCompanyInfo.name,
    logo: settings?.companyLogo || '',
    slogan: settings?.companySlogan || fallbackCompanyInfo.slogan,
    address: settings?.companyAddress || fallbackCompanyInfo.address,
    phone: settings?.companyPhone || fallbackCompanyInfo.phone,
    email: settings?.companyEmail || fallbackCompanyInfo.email,
    binVat: settings?.binVat || '',
    invoiceFooter: settings?.invoiceFooter || fallbackCompanyInfo.invoiceFooter,
  };
}

function getPaymentText(sale) {
  const methods = [];
  if (sale.paymentBreakdown?.cash > 0)
    methods.push(`Cash (৳${sale.paymentBreakdown.cash.toLocaleString()})`);
  if (sale.paymentBreakdown?.bkash > 0)
    methods.push(`bKash (৳${sale.paymentBreakdown.bkash.toLocaleString()})`);
  if (sale.paymentBreakdown?.rocket > 0)
    methods.push(`Rocket (৳${sale.paymentBreakdown.rocket.toLocaleString()})`);
  if (sale.paymentBreakdown?.nagad > 0)
    methods.push(`Nagad (৳${sale.paymentBreakdown.nagad.toLocaleString()})`);
  if (sale.paymentBreakdown?.bank > 0)
    methods.push(`Bank (৳${sale.paymentBreakdown.bank.toLocaleString()})`);
  return methods.length > 0 ? methods.join(', ') : 'Cash';
}

function getTotalPaid(sale) {
  return (
    (sale.paymentBreakdown?.cash || 0) +
    (sale.paymentBreakdown?.bkash || 0) +
    (sale.paymentBreakdown?.rocket || 0) +
    (sale.paymentBreakdown?.nagad || 0) +
    (sale.paymentBreakdown?.bank || 0)
  );
}

function getStatusStamp(sale) {
  const due = sale.paymentBreakdown?.dueAmount || 0;
  if (sale.status === 'RETURNED')
    return { label: 'RETURNED', color: 'border-red-600 text-red-600 bg-red-50' };
  if (sale.status === 'PARTIALLY_RETURNED')
    return { label: 'PARTIAL RETURN', color: 'border-amber-600 text-amber-600 bg-amber-50' };
  if (due <= 0)
    return { label: 'PAID', color: 'border-emerald-600 text-emerald-600 bg-emerald-50' };
  if (getTotalPaid(sale) > 0)
    return { label: 'PARTIAL PAID', color: 'border-blue-600 text-blue-600 bg-blue-50' };
  return { label: 'UNPAID', color: 'border-red-600 text-red-600 bg-red-50' };
}

export const getServedByText = (sale) => {
  if (!sale) return 'Authorized Staff';
  return (
    sale.sellerName ||
    sale.cashierName ||
    sale.sellerId?.fullName ||
    sale.sellerId?.name ||
    sale.createdBy?.fullName ||
    sale.createdBy?.name ||
    sale.cashierUsername ||
    'Authorized Staff'
  );
};

// ----------------------------------------------------------------------
// SIZE 1: A4 FULL SIZE (210mm x 297mm) - DYNAMIC & ZERO BLANK PAGE PRINT FIX
// ----------------------------------------------------------------------
export function InvoiceA4Full({ sale }) {
  const companyInfo = useCompanyInfo();
  const qrData = `INV: ${sale.invoiceNumber} | Total: Tk ${sale.netTotal?.toLocaleString() || 0} | Date: ${new Date(sale.createdAt).toLocaleDateString('en-BD')}`;

  const totalPaid = getTotalPaid(sale);
  const dueAmount = sale.paymentBreakdown?.dueAmount || 0;
  const statusStamp = getStatusStamp(sale);
  const cashierDisplayName = getServedByText(sale);

  return (
    <div
      className="bg-white text-slate-900 p-4 sm:p-6 md:p-8 w-full max-w-[210mm] min-h-[276mm] mx-auto flex flex-col justify-between shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-2 sm:print:p-4 print:max-w-none print:w-full print:min-h-[276mm] print:flex print:flex-col print:justify-between"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <div>
        {/* TOP BRANDING & INVOICE META */}
        <div className="flex justify-between items-start mb-3 print:break-inside-avoid">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              {companyInfo.logo && (
                <img
                  src={getAssetUrl(companyInfo.logo)}
                  alt="Logo"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  className="h-8 w-auto max-w-[80px] object-contain flex-shrink-0"
                />
              )}
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                  {companyInfo.name}
                </h1>
                {sale.branch?.name && (
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    {sale.branch.name}
                  </p>
                )}
              </div>
            </div>
            {companyInfo.slogan && !sale.branch?.name && (
              <p className="text-xs font-medium text-slate-500">{companyInfo.slogan}</p>
            )}
            {(sale.branch?.address || companyInfo.address) && (
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                {sale.branch?.address || companyInfo.address}
              </p>
            )}
            <div className="text-xs text-slate-500 flex flex-wrap gap-x-2 gap-y-0.5 pt-0.5">
              {(sale.branch?.phone || companyInfo.phone) && (
                <span>
                  <strong>Phone:</strong> {sale.branch?.phone || companyInfo.phone}
                </span>
              )}
              {(sale.branch?.email || companyInfo.email) && (
                <>
                  <span>•</span>
                  <span>
                    <strong>Email:</strong> {sale.branch?.email || companyInfo.email}
                  </span>
                </>
              )}
              {companyInfo.binVat && (
                <>
                  <span>•</span>
                  <span>
                    <strong>{companyInfo.binVat}</strong>
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="text-right flex flex-col items-end space-y-1">
            <div className="text-sm font-black tracking-wider uppercase text-slate-900 border-b-2 border-slate-900 pb-0.5">
              {sale.saleType === 'WHOLESALE' ? 'WHOLESALE INVOICE' : 'INVOICE'}
            </div>
            <div className="pt-0.5">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Invoice No
              </p>
              <p className="text-lg font-mono font-bold text-slate-900 tracking-tight">
                {sale.invoiceNumber}
              </p>
            </div>
            <div className="text-xs text-slate-600 leading-tight space-y-0.5">
              <p>
                <strong>Date:</strong>{' '}
                {new Date(sale.createdAt).toLocaleDateString('en-BD', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                })}
              </p>
              <p>
                <strong>Time:</strong>{' '}
                {new Date(sale.createdAt).toLocaleTimeString('en-BD', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-xs font-semibold text-slate-700">
                Served By: {cashierDisplayName}
              </p>
            </div>
          </div>
        </div>

        <hr className="border-t-2 border-slate-900 my-3" />

        {/* CUSTOMER INFO & STATUS STAMP (MINIMAL, ZERO HEAVY CARDS) */}
        <div className="grid grid-cols-12 gap-4 mb-4 pb-2 border-b border-slate-200 print:break-inside-avoid">
          <div className="col-span-8 space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
              Bill To / Customer Details
            </span>
            <p className="font-extrabold text-slate-900 text-sm">
              {sale.customerName || sale.customerId?.name || 'Walk-in Customer'}
            </p>
            <p className="text-xs text-slate-600 font-mono">
              Phone: {sale.customerPhone || sale.customerId?.phone || 'N/A'}
            </p>
            {(sale.customerEmail || sale.customerId?.email) && (
              <p className="text-xs text-slate-500">
                Email: {sale.customerEmail || sale.customerId?.email}
              </p>
            )}
            {(sale.customerAddress || sale.customerId?.address) && (
              <p className="text-xs text-slate-500">
                Address: {sale.customerAddress || sale.customerId?.address}
              </p>
            )}
          </div>

          <div className="col-span-4 flex items-center justify-end">
            <div
              className={`border-2 ${statusStamp.color} font-black text-sm px-4 py-1.5 rounded uppercase tracking-wider text-center`}
            >
              {statusStamp.label}
              {dueAmount > 0 && (
                <span className="block text-[9px] tracking-normal font-bold">
                  Due: ৳{dueAmount.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* PRODUCTS DATA TABLE (MINIMAL CLEAN BORDERS) */}
        <div className="mb-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-y-2 border-slate-900 text-slate-900 uppercase text-[10px] font-black tracking-wider print:break-inside-avoid">
                <th className="py-2 px-2 text-center w-8">#</th>
                <th className="py-2 px-2">Product & Specification</th>
                <th className="py-2 px-2">IMEI / Serial Number</th>
                <th className="py-2 px-2 text-center">Warranty</th>
                <th className="py-2 px-2 text-center w-12">Qty</th>
                <th className="py-2 px-2 text-right w-24">Unit Price</th>
                <th className="py-2 px-2 text-right w-24">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sale.lineItems?.map((item, index) => {
                const p = item.productId || {};
                const brandModelStr = [p.brand, p.model].filter(Boolean).join(' ');
                const specsStr = [
                  p.ram && `${p.ram} RAM`,
                  p.storage && `${p.storage} Storage`,
                  p.color,
                ]
                  .filter(Boolean)
                  .join(' • ');

                return (
                  <tr key={index} className="hover:bg-slate-50/50 print:break-inside-avoid">
                    <td className="py-2 px-2 text-center font-bold text-slate-400">{index + 1}</td>
                    <td className="py-2 px-2">
                      <div className="font-bold text-slate-900 text-xs">
                        {item.description || p.name || 'Mobile Phone Item'}
                      </div>
                      {(brandModelStr || specsStr) && (
                        <div className="text-[10px] text-slate-600 mt-0.5">
                          {brandModelStr && (
                            <span className="font-semibold text-slate-700">{brandModelStr}</span>
                          )}
                          {brandModelStr && specsStr && <span className="mx-1">•</span>}
                          {specsStr && <span>{specsStr}</span>}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2 font-mono text-[11px] text-slate-700">
                      {item.imeiOrSerial ? (
                        <span className="font-semibold text-slate-800">{item.imeiOrSerial}</span>
                      ) : (
                        <span className="text-slate-400 font-sans italic text-[10px]">
                          Bulk Product
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center font-medium text-slate-600 text-[11px]">
                      {p.defaultWarrantyMonths
                        ? `${p.defaultWarrantyMonths} Months`
                        : '1 Year Official'}
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-slate-800">{item.qty}</td>
                    <td className="py-2 px-2 text-right font-medium text-slate-800">
                      ৳{item.unitPrice?.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-slate-900">
                      ৳{item.totalPrice?.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* SUMMARY & FINANCIAL BREAKDOWN (MINIMAL LAYOUT) */}
        <div className="grid grid-cols-12 gap-6 mb-4 pt-2 border-t border-slate-200 print:break-inside-avoid">
          <div className="col-span-7 space-y-3">
            <div>
              <span className="font-extrabold uppercase text-slate-400 text-[9px] block mb-0.5">
                Payment Method / Received Via
              </span>
              <p className="font-semibold text-slate-800 text-xs">{getPaymentText(sale)}</p>
            </div>

            <div>
              <span className="font-extrabold uppercase text-slate-400 text-[9px] block mb-0.5">
                Amount In Words
              </span>
              <p className="font-bold text-slate-900 italic text-xs leading-snug">
                {numberToWordsBD(sale.netTotal)}
              </p>
            </div>
          </div>

          <div className="col-span-5 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Subtotal:</span>
              <span>৳{sale.subTotal?.toLocaleString()}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-red-600 font-medium">
                <span>Special Discount:</span>
                <span>-৳{sale.discount?.toLocaleString()}</span>
              </div>
            )}
            {sale.tax > 0 && (
              <div className="flex justify-between text-slate-600 font-medium">
                <span>VAT / Tax:</span>
                <span>+৳{sale.tax?.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm font-black text-slate-900 py-1.5 border-y-2 border-slate-900 my-1">
              <span>GRAND TOTAL:</span>
              <span>৳{sale.netTotal?.toLocaleString()}</span>
            </div>
            {sale.returnedAmount > 0 && (
              <>
                <div className="flex justify-between text-red-600 font-bold text-xs">
                  <span>Less Item Return Refund:</span>
                  <span>-৳{sale.returnedAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-black text-red-700 py-1 border-b-2 border-red-700 my-1">
                  <span>NET PAYABLE / ADJUSTED TOTAL:</span>
                  <span>
                    ৳{((sale.netTotal || 0) - (sale.returnedAmount || 0)).toLocaleString()}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Total Paid:</span>
              <span>৳{totalPaid.toLocaleString()}</span>
            </div>
            {Number(sale.paymentBreakdown?.changeAmount || 0) > 0 && (
              <div className="flex justify-between text-blue-700 font-extrabold text-xs pt-0.5">
                <span>Change Returned (ফেরত):</span>
                <span>৳{Number(sale.paymentBreakdown.changeAmount).toLocaleString()}</span>
              </div>
            )}
            {dueAmount > 0 && (
              <div className="flex justify-between text-red-600 font-extrabold text-sm pt-0.5">
                <span>Balance Due:</span>
                <span>৳{dueAmount.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* TERMS AND CONDITIONS (MINIMAL FOOTNOTE) */}
        <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 mb-4 leading-relaxed print:break-inside-avoid">
          <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-0.5">
            Warranty & Return Terms
          </h4>
          <p className="leading-snug">
            1. Original receipt & intact IMEI sticker required for warranty claims. &nbsp; 2.
            Warranty covers hardware manufacturing defects only. Software, liquid or physical damage
            excluded. &nbsp; 3. Goods non-refundable after 7 days.
          </p>
        </div>
      </div>

      {/* FOOTER: SIGNATURES, BARCODE & QR CODE (PINNED TO BOTTOM, NO TOP BORDER) */}
      <div className="pt-2 mt-auto flex-shrink-0 print:break-inside-avoid">
        <div className="grid grid-cols-12 gap-4 items-end mb-3">
          <div className="col-span-4 text-center">
            <div className="border-t border-dashed border-slate-800 w-40 mx-auto pt-1 text-xs font-bold text-slate-800">
              Customer Signature
            </div>
          </div>
          <div className="col-span-4 flex flex-col items-center justify-center">
            <BarcodeCanvas value={sale.invoiceNumber} width={1.4} height={28} />
          </div>
          <div className="col-span-4 text-center">
            <div className="border-t border-dashed border-slate-800 w-40 mx-auto pt-1 text-xs font-bold text-slate-800">
              Authorized Signature & Seal
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-200">
          <div>
            Printed on: {new Date().toLocaleString('en-BD')} | {companyInfo.invoiceFooter} •{' '}
            <span className="font-semibold text-slate-700">Powered by OmniManage ERP Suite</span>
          </div>
          <div className="flex items-center gap-2">
            <QRCodeCanvas value={qrData} size={54} />
            <div className="text-left font-mono text-[9px] leading-tight">
              <p className="font-bold text-slate-800">{companyInfo.name}</p>
              <p className="text-[8px] text-slate-500">Scan to verify invoice</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// SIZE 2: HALF A4 SIZE (A5: 148mm x 210mm) - DYNAMIC & ZERO BLANK PAGE FIX
// ----------------------------------------------------------------------
export function InvoiceA4Half({ sale }) {
  const companyInfo = useCompanyInfo();
  const qrData = `INV: ${sale.invoiceNumber} | Total: Tk ${sale.netTotal?.toLocaleString() || 0}`;

  const totalPaid = getTotalPaid(sale);
  const dueAmount = sale.paymentBreakdown?.dueAmount || 0;
  const statusStamp = getStatusStamp(sale);

  return (
    <div
      className="bg-white text-slate-900 p-3 sm:p-4 md:p-5 w-full max-w-[210mm] mx-auto flex flex-col justify-between shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-3 print:max-w-none print:w-full print:min-h-0 print:h-auto print:break-inside-avoid print:page-break-inside-avoid"
      style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '10px' }}
    >
      <div>
        {/* HEADER BRANDING */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-2">
              {companyInfo.logo && (
                <img
                  src={getAssetUrl(companyInfo.logo)}
                  alt="Logo"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  className="h-7 w-auto max-w-[100px] object-contain"
                />
              )}
              <div>
                <h1 className="text-base font-black tracking-tight text-slate-900 leading-none">
                  {companyInfo.name}
                </h1>
                {sale.branch?.name && (
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    {sale.branch.name}
                  </p>
                )}
              </div>
            </div>
            {(sale.branch?.address || companyInfo.address) && (
              <p className="text-[9px] text-slate-600">
                {sale.branch?.address || companyInfo.address}
              </p>
            )}
            <p className="text-[9px] text-slate-500">
              Phone: {sale.branch?.phone || companyInfo.phone}{' '}
              {companyInfo.binVat && `| ${companyInfo.binVat}`}
            </p>
          </div>
          <div className="text-right">
            <span className="text-slate-900 font-extrabold text-[10px] uppercase border-b border-slate-900 pb-0.5">
              {sale.saleType === 'WHOLESALE' ? 'WHOLESALE' : 'INVOICE'}
            </span>
            <p className="text-xs font-mono font-bold text-slate-900 mt-1">{sale.invoiceNumber}</p>
            <p className="text-[9px] text-slate-500">
              {new Date(sale.createdAt).toLocaleDateString('en-BD')}
            </p>
            <p className="text-[9px] font-semibold text-slate-700">
              Served By: {getServedByText(sale)}
            </p>
          </div>
        </div>

        <hr className="border-t-2 border-slate-900 my-2" />

        {/* CUSTOMER & STATUS */}
        <div className="grid grid-cols-12 gap-3 mb-2.5 text-[10px]">
          <div className="col-span-8 bg-slate-50 p-2 rounded border border-slate-200">
            <span className="font-bold text-slate-500 uppercase text-[8px] block border-b border-slate-200 pb-0.5 mb-1">
              Customer / Bill To
            </span>
            <p className="font-bold text-slate-900 text-xs">
              {sale.customerName || 'Walk-in Customer'}
            </p>
            <p className="text-slate-600 font-mono text-[9px]">
              Phone: {sale.customerPhone || 'N/A'}
            </p>
          </div>
          <div className="col-span-4 flex items-center justify-center">
            <div
              className={`border-2 ${statusStamp.color} font-black text-xs px-2.5 py-0.5 rounded uppercase tracking-wider`}
            >
              {statusStamp.label}
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="mb-2.5 border border-slate-300 rounded overflow-hidden">
          <table className="w-full text-left text-[9px] border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[8px] tracking-wider">
                <th className="py-1 px-1.5 text-center w-6 border-r border-slate-800">#</th>
                <th className="py-1 px-1.5 border-r border-slate-800">Product & Specification</th>
                <th className="py-1 px-1.5 border-r border-slate-800">IMEI / Serial</th>
                <th className="py-1 px-1.5 text-center w-8 border-r border-slate-800">Qty</th>
                <th className="py-1 px-1.5 text-right w-14 border-r border-slate-800">Price</th>
                <th className="py-1 px-1.5 text-right w-14">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sale.lineItems?.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="py-1 px-1.5 text-center font-bold text-slate-500 border-r border-slate-200">
                    {index + 1}
                  </td>
                  <td className="py-1 px-1.5 border-r border-slate-200">
                    <div className="font-bold text-slate-900">{item.description}</div>
                  </td>
                  <td className="py-1 px-1.5 border-r border-slate-200 font-mono text-[8px]">
                    {item.imeiOrSerial ? (
                      <span className="font-semibold bg-slate-100 px-1 py-0.5 rounded border border-slate-200 inline-block text-slate-800">
                        {item.imeiOrSerial}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic font-sans">Bulk</span>
                    )}
                  </td>
                  <td className="py-1 px-1.5 text-center font-bold border-r border-slate-200">
                    {item.qty}
                  </td>
                  <td className="py-1 px-1.5 text-right border-r border-slate-200">
                    ৳{item.unitPrice?.toLocaleString()}
                  </td>
                  <td className="py-1 px-1.5 text-right font-bold text-slate-900">
                    ৳{item.totalPrice?.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FINANCIAL SUMMARY & WORDS */}
        <div className="grid grid-cols-12 gap-2.5 mb-2.5">
          <div className="col-span-7 text-[9px] space-y-1">
            <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
              <span className="font-bold uppercase text-[8px] text-slate-500 block">
                Payment Method
              </span>
              <p className="font-semibold text-slate-800">{getPaymentText(sale)}</p>
            </div>
            <div className="bg-slate-100 p-1.5 rounded border border-slate-200">
              <span className="font-bold uppercase text-[8px] text-slate-500 block">
                Amount in Words
              </span>
              <p className="font-bold text-slate-900 italic text-[9px]">
                {numberToWordsBD(sale.netTotal)}
              </p>
            </div>
          </div>

          <div className="col-span-5 border border-slate-300 rounded p-1.5 pb-2 text-[9px] space-y-1 bg-slate-50">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>৳{sale.subTotal?.toLocaleString()}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span>-৳{sale.discount?.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-white bg-slate-900 p-1 rounded text-[9px]">
              <span>GRAND TOTAL:</span>
              <span>৳{sale.netTotal?.toLocaleString()}</span>
            </div>
            {sale.returnedAmount > 0 && (
              <>
                <div className="flex justify-between font-bold text-red-600">
                  <span>Less Item Refund:</span>
                  <span>-৳{sale.returnedAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-red-700 bg-red-50 p-1 rounded text-[9px] border border-red-200">
                  <span>NET REVISED TOTAL:</span>
                  <span>
                    ৳
                    {Math.max(
                      0,
                      (sale.netTotal || 0) - (sale.returnedAmount || 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Net Paid:</span>
              <span>৳{Math.max(0, totalPaid - (sale.returnedAmount || 0)).toLocaleString()}</span>
            </div>
            {Number(sale.paymentBreakdown?.changeAmount || 0) > 0 && (
              <div className="flex justify-between text-blue-700 font-bold text-[9px]">
                <span>Change (ফেরত):</span>
                <span>৳{Number(sale.paymentBreakdown.changeAmount).toLocaleString()}</span>
              </div>
            )}
            {dueAmount > 0 && (
              <div className="flex justify-between text-red-600 font-bold">
                <span>Balance Due:</span>
                <span>৳{dueAmount.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t border-slate-300 pt-2 mt-auto">
        <div className="flex justify-between items-end mb-1">
          <div className="text-center">
            <div className="border-t border-dashed border-slate-800 w-24 pt-0.5 text-[8px] font-bold">
              Customer Signature
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <BarcodeCanvas value={sale.invoiceNumber} width={1.0} height={20} />
            <QRCodeCanvas value={qrData} size={48} />
          </div>
          <div className="text-center">
            <div className="border-t border-dashed border-slate-800 w-24 pt-0.5 text-[8px] font-bold">
              Authorized Seal
            </div>
          </div>
        </div>
        <p className="text-center text-[8px] text-slate-500">
          {companyInfo.invoiceFooter} •{' '}
          <span className="font-semibold text-slate-700">Powered by OmniManage ERP Suite</span>
        </p>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// SIZE 3: RECEIPT (80mm Thermal)
// ----------------------------------------------------------------------
export function InvoiceReceipt({ sale }) {
  const companyInfo = useCompanyInfo();
  const qrData = `INV: ${sale.invoiceNumber} | Total: Tk ${sale.netTotal?.toLocaleString() || 0}`;
  const totalPaid = getTotalPaid(sale);
  const dueAmount = sale.paymentBreakdown?.dueAmount || 0;

  return (
    <div className="bg-white text-slate-900 p-3 max-w-[80mm] mx-auto text-xs font-mono border border-slate-200 shadow-md print:shadow-none print:border-none">
      <div className="text-center mb-2 pb-2 border-b border-dashed border-slate-400">
        <p className="font-bold text-sm tracking-tight">{companyInfo.name}</p>
        <p className="text-[10px]">{companyInfo.slogan}</p>
        <p className="text-[9px]">{companyInfo.phone}</p>
      </div>

      <div className="border-b border-dashed border-slate-400 pb-2 mb-2 text-[11px] space-y-0.5">
        <p className="font-bold">INV: {sale.invoiceNumber}</p>
        <p>Date: {new Date(sale.createdAt).toLocaleDateString('en-BD')}</p>
        <p>Customer: {sale.customerName || 'Walk-in'}</p>
        {sale.customerPhone && <p>Phone: {sale.customerPhone}</p>}
        <p className="text-[10px] text-slate-700 font-semibold">
          Served By: {getServedByText(sale)}
        </p>
      </div>

      <div className="border-b border-dashed border-slate-400 pb-2 mb-2 space-y-1">
        {sale.lineItems?.map((item, i) => (
          <div key={i} className="text-[11px]">
            <div className="font-bold truncate">{item.description}</div>
            {item.imeiOrSerial && (
              <div className="text-[9px] text-slate-600">IMEI: {item.imeiOrSerial}</div>
            )}
            <div className="flex justify-between text-[10px] text-slate-700">
              <span>
                {item.qty} x ৳{item.unitPrice?.toLocaleString()}
              </span>
              <span className="font-bold text-slate-900">৳{item.totalPrice?.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-b border-dashed border-slate-400 pb-2 mb-2 space-y-0.5 text-[11px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>৳{sale.subTotal?.toLocaleString()}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Discount:</span>
            <span>-৳{sale.discount?.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm border-t border-slate-800 pt-0.5">
          <span>NET TOTAL:</span>
          <span>৳{sale.netTotal?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Paid:</span>
          <span>৳{totalPaid.toLocaleString()}</span>
        </div>
        {Number(sale.paymentBreakdown?.changeAmount || 0) > 0 && (
          <div className="flex justify-between font-bold text-blue-600">
            <span>CHANGE (ফেরত):</span>
            <span>৳{Number(sale.paymentBreakdown.changeAmount).toLocaleString()}</span>
          </div>
        )}
        {dueAmount > 0 && (
          <div className="flex justify-between font-bold text-red-600">
            <span>DUE:</span>
            <span>৳{dueAmount.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="text-center pt-1 space-y-1">
        <BarcodeCanvas value={sale.invoiceNumber} width={1.2} height={28} />
        <div className="flex justify-center my-1">
          <QRCodeCanvas value={qrData} size={64} />
        </div>
        <p className="text-[9px] text-slate-500 pt-1">{companyInfo.invoiceFooter}</p>
        <p className="text-[8px] text-slate-400 font-sans">Powered by OmniManage ERP Suite</p>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// SIZE 4: THERMAL (58mm Thermal)
// ----------------------------------------------------------------------
export function InvoiceThermal({ sale }) {
  const companyInfo = useCompanyInfo();
  const qrData = `INV: ${sale.invoiceNumber} | Total: Tk ${sale.netTotal?.toLocaleString() || 0}`;
  const totalPaid = getTotalPaid(sale);
  const dueAmount = sale.paymentBreakdown?.dueAmount || 0;

  return (
    <div className="bg-white text-slate-900 p-2 max-w-[58mm] mx-auto text-[10px] font-mono border border-slate-200 shadow-md print:shadow-none print:border-none">
      <div className="text-center mb-1 pb-1 border-b border-slate-400">
        <p className="font-bold text-xs">{companyInfo.name}</p>
        <p className="text-[8px]">{companyInfo.phone}</p>
      </div>

      <div className="border-b border-slate-400 pb-1 mb-1 text-[9px]">
        <p className="font-bold">#{sale.invoiceNumber}</p>
        <p>{new Date(sale.createdAt).toLocaleDateString('en-BD')}</p>
        <p>Cust: {sale.customerName || 'Walk-in'}</p>
        <p className="text-[8px]">Served: {getServedByText(sale)}</p>
      </div>

      <div className="border-b border-slate-400 pb-1 mb-1 space-y-1">
        {sale.lineItems?.map((item, i) => (
          <div key={i} className="py-0.5">
            <div className="font-bold truncate">{item.description}</div>
            {item.imeiOrSerial && <div className="text-[7px]">S/N: {item.imeiOrSerial}</div>}
            <div className="flex justify-between text-[8px]">
              <span>
                {item.qty}x@৳{item.unitPrice}
              </span>
              <span className="font-bold">৳{item.totalPrice}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-b border-slate-400 pb-1 mb-1 text-[9px] space-y-0.5">
        <div className="flex justify-between">
          <span>Sub:</span>
          <span>৳{sale.subTotal}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Disc:</span>
            <span>-৳{sale.discount}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-xs border-t border-black pt-0.5">
          <span>TOTAL:</span>
          <span>৳{sale.netTotal}</span>
        </div>
        <div className="flex justify-between">
          <span>Paid:</span>
          <span>৳{totalPaid}</span>
        </div>
        {Number(sale.paymentBreakdown?.changeAmount || 0) > 0 && (
          <div className="flex justify-between font-bold text-blue-600">
            <span>Change:</span>
            <span>৳{Number(sale.paymentBreakdown.changeAmount)}</span>
          </div>
        )}
        {dueAmount > 0 && (
          <div className="flex justify-between font-bold text-red-600">
            <span>DUE:</span>
            <span>৳{dueAmount}</span>
          </div>
        )}
      </div>

      <div className="text-center pt-1 space-y-0.5">
        <div className="flex justify-center my-1">
          <QRCodeCanvas value={qrData} size={54} />
        </div>
        <p className="text-[7px]">{companyInfo.invoiceFooter}</p>
        <p className="text-[6.5px] text-slate-400 font-sans">Powered by OmniManage ERP Suite</p>
      </div>
    </div>
  );
}
