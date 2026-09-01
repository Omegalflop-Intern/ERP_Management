import React from 'react';
import { BarcodeCanvas, numberToWordsBD, QRCodeCanvas, useCompanyInfo } from './Invoice';

export default function ReturnCreditNote({ sale, returnLog, returnLogsGroup }) {
  const companyInfo = useCompanyInfo();

  // If a group of logs passed (from latest return action) or a single log or all logs
  const logsToRender = returnLogsGroup || (returnLog ? [returnLog] : sale?.returnLogs || []);
  const firstLog = logsToRender[0] || {};
  const creditNoteNumber = firstLog.returnInvoiceNumber || 'RET-CREDIT-NOTE';
  const returnDate = firstLog.returnedAt ? new Date(firstLog.returnedAt) : new Date();

  const totalRefund = logsToRender.reduce((sum, item) => sum + (item.refundAmount || 0), 0);

  const qrData = JSON.stringify({
    cn: creditNoteNumber,
    inv: sale?.invoiceNumber,
    refund: totalRefund,
    dt: returnDate.toISOString().split('T')[0],
  });

  return (
    <div
      data-printable="true"
      className="printable-invoice-container printable-slip bg-white text-slate-900 p-8 max-w-[210mm] min-h-[276mm] mx-auto flex flex-col justify-between shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-2 sm:print:p-4 print:max-w-none print:w-full print:min-h-[276mm] print:flex print:flex-col print:justify-between"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <div>
        {/* HEADER BRANDING & CREDIT NOTE TITLE */}
        <div className="flex justify-between items-start mb-4 border-b-2 border-slate-900 pb-3">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-slate-900">{companyInfo.name}</h1>
            {companyInfo.slogan && (
              <p className="text-xs text-slate-600 font-medium">{companyInfo.slogan}</p>
            )}
            {companyInfo.address && <p className="text-xs text-slate-500">{companyInfo.address}</p>}
            <p className="text-xs text-slate-500">
              Phone: {companyInfo.phone} {companyInfo.binVat && `| ${companyInfo.binVat}`}
            </p>
          </div>

          <div className="text-right space-y-1">
            <span className="inline-block bg-[#2563EB] text-white font-black px-3 py-1 text-xs tracking-wider uppercase rounded-md shadow-sm">
              CREDIT NOTE / RETURN VOUCHER
            </span>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Credit Note No
              </p>
              <p className="text-lg font-mono font-bold text-red-700">{creditNoteNumber}</p>
            </div>
            <div className="text-xs text-slate-600">
              <p>
                <strong>Original Invoice:</strong>{' '}
                <span className="font-mono font-bold text-slate-900">{sale?.invoiceNumber}</span>
              </p>
              <p>
                <strong>Return Date:</strong>{' '}
                {returnDate.toLocaleDateString('en-BD', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* CUSTOMER & SALE DETAILS */}
        <div className="grid grid-cols-12 gap-4 mb-4 text-xs">
          <div className="col-span-8 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-400 uppercase text-[9px] block mb-1">
              Customer / Refund Recipient
            </span>
            <p className="font-bold text-slate-900 text-sm">
              {sale?.customerName || 'Walk-in Customer'}
            </p>
            <p className="text-slate-600 font-mono">Phone: {sale?.customerPhone || 'N/A'}</p>
            {sale?.customerAddress && (
              <p className="text-slate-500 text-[11px]">{sale.customerAddress}</p>
            )}
          </div>

          <div className="col-span-4 bg-red-50/50 p-3 rounded-lg border border-red-200/60 flex flex-col justify-between">
            <span className="font-bold text-red-700 uppercase text-[9px]">Refund Status</span>
            <div>
              <p className="text-xs text-slate-500">Refund Method</p>
              <p className="font-bold text-slate-900 text-xs">Cash Refund / Account Credit</p>
            </div>
            <div className="text-right font-mono font-bold text-red-700 text-sm pt-1 border-t border-red-200">
              ৳{totalRefund.toLocaleString()}
            </div>
          </div>
        </div>

        {/* RETURNED ITEMS TABLE */}
        <div className="mb-4 border border-slate-300 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                <th className="py-2 px-3 text-center w-8 border-r border-slate-800">#</th>
                <th className="py-2 px-3 border-r border-slate-800">Returned Item Description</th>
                <th className="py-2 px-3 border-r border-slate-800">IMEI / Serial</th>
                <th className="py-2 px-3 text-center w-12 border-r border-slate-800">Qty</th>
                <th className="py-2 px-3 text-right w-24 border-r border-slate-800">
                  Refund Price
                </th>
                <th className="py-2 px-3 text-right w-24">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {logsToRender.map((log, index) => {
                const effectivePrice =
                  log.effectiveUnitPrice ||
                  (log.qty > 0 ? Math.round(log.refundAmount / log.qty) : log.refundAmount);

                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="py-2 px-3 text-center font-bold text-slate-500 border-r border-slate-200">
                      {index + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      <div className="font-bold text-slate-900">
                        {log.description || 'Returned Line Item'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Reason:{' '}
                        <span className="font-semibold uppercase text-red-600">
                          {log.reason || 'defective'}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono text-xs">
                      {log.imeiOrSerial ? (
                        <span className="font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">
                          {log.imeiOrSerial}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Bulk Item</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center font-bold border-r border-slate-200">
                      {log.qty}
                    </td>
                    <td className="py-2 px-3 text-right border-r border-slate-200">
                      ৳{effectivePrice?.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-red-700">
                      ৳{log.refundAmount?.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* FINANCIAL SUMMARY & WORDS */}
        <div className="grid grid-cols-12 gap-4 mb-4">
          <div className="col-span-7 text-xs space-y-2">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="font-bold uppercase text-[9px] text-slate-400 block mb-0.5">
                Refund Amount in Words
              </span>
              <p className="font-bold text-slate-900 italic text-xs leading-relaxed">
                {numberToWordsBD(totalRefund)}
              </p>
            </div>
            <p className="text-[10px] text-slate-500 leading-snug">
              Note: This Credit Note represents an official return voucher adjusting invoice #
              {sale?.invoiceNumber}. Returned goods have been received intact and processed into
              inventory.
            </p>
          </div>

          <div className="col-span-5 text-xs space-y-1 bg-red-50/40 p-3 rounded-lg border border-red-200">
            <div className="flex justify-between text-slate-600">
              <span>Original Invoice Total:</span>
              <span>৳{sale?.netTotal?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-red-600 font-bold">
              <span>Total Refund Amount:</span>
              <span>-৳{totalRefund.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-black text-slate-900 py-1.5 border-t border-slate-900 mt-1">
              <span>REVISED NET INVOICE:</span>
              <span>
                ৳
                {Math.max(
                  0,
                  (sale?.netTotal || 0) - (sale?.returnedAmount || totalRefund)
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER: SIGNATURES & QR CODE */}
      <div className="pt-4 border-t border-slate-200 mt-auto">
        <div className="grid grid-cols-12 gap-4 items-end mb-4">
          <div className="col-span-4 text-center">
            <div className="border-t border-dashed border-slate-800 w-36 mx-auto pt-1 text-xs font-bold text-slate-800">
              Customer Signature
            </div>
          </div>
          <div className="col-span-4 flex flex-col items-center justify-center">
            <BarcodeCanvas value={creditNoteNumber} width={1.4} height={28} />
          </div>
          <div className="col-span-4 text-center">
            <div className="border-t border-dashed border-slate-800 w-36 mx-auto pt-1 text-xs font-bold text-slate-800">
              Authorized Seal &amp; Signature
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-200">
          <div>
            Issued on: {returnDate.toLocaleString('en-BD')} | {companyInfo.invoiceFooter} •{' '}
            <span className="font-semibold text-slate-700">Powered by OmniManage ERP Suite</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 min-w-[32px] min-h-[32px] overflow-hidden flex-shrink-0">
              <QRCodeCanvas value={qrData} size={32} />
            </div>
            <div className="text-left font-mono text-[9px]">
              <p className="font-bold text-slate-800">{companyInfo.name}</p>
              <p className="text-[8px] text-slate-500">Official Credit Note</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
