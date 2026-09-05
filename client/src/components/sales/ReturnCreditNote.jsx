import React from 'react';
import {
  useCompanyInfo,
  BarcodeCanvas,
  QRCodeCanvas,
  numberToWordsBD,
} from './Invoice';
import { getAssetUrl } from '../../lib/api';
import { RotateCcw, User, CheckCircle, ArrowDownLeft } from 'lucide-react';

export default function ReturnCreditNote({ sale, returnLog, returnLogsGroup }) {
  const companyInfo = useCompanyInfo();

  // If a group of logs passed (from latest return action) or a single log or all logs
  const logsToRender = returnLogsGroup || (returnLog ? [returnLog] : sale?.returnLogs || []);
  const firstLog = logsToRender[0] || {};
  const creditNoteNumber =
    firstLog.returnInvoiceNumber ||
    `RET-${String(sale?.invoiceNumber || '').replace(/^INV-/, '') || 'CREDIT'}`;
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
      className="printable-invoice-container printable-slip bg-white text-slate-900 p-4 sm:p-6 md:p-8 w-full max-w-[210mm] min-h-[276mm] mx-auto flex flex-col justify-between shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-2 sm:print:p-4 print:max-w-none print:w-full print:min-h-[276mm] print:flex print:flex-col print:justify-between"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <div>
        {/* 1. TOP BRANDING & CREDIT NOTE META */}
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
                {companyInfo.slogan && (
                  <p className="text-xs font-medium text-slate-500 mt-0.5">{companyInfo.slogan}</p>
                )}
              </div>
            </div>
            {companyInfo.address && (
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                {companyInfo.address}
              </p>
            )}
            <div className="text-xs text-slate-500 flex flex-wrap gap-x-2 gap-y-0.5 pt-0.5">
              {companyInfo.phone && (
                <span>
                  <strong>Phone:</strong> {companyInfo.phone}
                </span>
              )}
              {companyInfo.email && (
                <>
                  <span>•</span>
                  <span>
                    <strong>Email:</strong> {companyInfo.email}
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
            <div className="text-sm font-black tracking-wider uppercase text-blue-700 border-b-2 border-slate-900 pb-0.5 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-blue-700 inline" />
              CREDIT NOTE / RETURN VOUCHER
            </div>
            <div className="pt-0.5">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Credit Note No
              </p>
              <p className="text-lg font-mono font-bold text-rose-700 tracking-tight">
                {creditNoteNumber}
              </p>
            </div>
            <div className="text-xs text-slate-600 leading-tight space-y-0.5">
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
              <p>
                <strong>Return Time:</strong>{' '}
                {returnDate.toLocaleTimeString('en-BD', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        <hr className="border-t-2 border-slate-900 my-3" />

        {/* 2. CUSTOMER DETAILS & REFUND BADGE */}
        <div className="grid grid-cols-12 gap-4 mb-4 pb-2 border-b border-slate-200 print:break-inside-avoid">
          <div className="col-span-8 space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5 flex items-center gap-1">
              <User className="w-3 h-3 text-blue-600 inline" /> Customer / Refund Recipient
            </span>
            <p className="font-extrabold text-slate-900 text-sm">
              {sale?.customerName || sale?.customerId?.name || 'Walk-in Customer'}
            </p>
            <p className="text-xs text-slate-600 font-mono">
              Phone: {sale?.customerPhone || sale?.customerId?.phone || 'N/A'}
            </p>
            {(sale?.customerEmail || sale?.customerId?.email) && (
              <p className="text-xs text-slate-500">
                Email: {sale?.customerEmail || sale?.customerId?.email}
              </p>
            )}
            {(sale?.customerAddress || sale?.customerId?.address) && (
              <p className="text-xs text-slate-500">
                Address: {sale?.customerAddress || sale?.customerId?.address}
              </p>
            )}
          </div>

          <div className="col-span-4 flex flex-col justify-between items-end text-right">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                Refund Method
              </span>
              <p className="font-bold text-slate-900 text-xs">
                Cash Refund / Account Credit / Replacement
              </p>
            </div>

            <div className="border-2 border-rose-600 text-rose-700 bg-rose-50 font-black text-xs px-3.5 py-1 rounded uppercase tracking-wider text-center mt-2">
              REFUND ISSUED: ৳{totalRefund.toLocaleString()}
            </div>
          </div>
        </div>

        {/* 3. RETURNED ITEMS DATA TABLE */}
        <div className="mb-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-y-2 border-slate-900 text-slate-900 uppercase text-[10px] font-black tracking-wider print:break-inside-avoid">
                <th className="py-2 px-2 text-center w-8">#</th>
                <th className="py-2 px-2">Returned Item Description</th>
                <th className="py-2 px-2">IMEI / Serial</th>
                <th className="py-2 px-2">Return Reason</th>
                <th className="py-2 px-2 text-center w-12">Qty</th>
                <th className="py-2 px-2 text-right w-24">Refund Rate</th>
                <th className="py-2 px-2 text-right w-28">Refund Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {logsToRender.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-slate-400">
                    No return logs found
                  </td>
                </tr>
              ) : (
                logsToRender.map((log, index) => {
                  const effectivePrice =
                    log.effectiveUnitPrice ||
                    (log.qty > 0 ? Math.round(log.refundAmount / log.qty) : log.refundAmount);

                  return (
                    <tr key={index} className="hover:bg-slate-50/50 print:break-inside-avoid">
                      <td className="py-2 px-2 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-2 px-2">
                        <div className="font-bold text-slate-900 text-xs">
                          {log.description || 'Returned Line Item'}
                        </div>
                      </td>
                      <td className="py-2 px-2 font-mono text-[11px] text-slate-700">
                        {log.imeiOrSerial ? (
                          <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {log.imeiOrSerial}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Bulk Item</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-[11px]">
                        <span className="font-semibold uppercase text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          {log.reason || 'defective'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-slate-800">
                        {log.qty || 1}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-medium text-slate-800">
                        ৳{Number(effectivePrice || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-rose-700">
                        ৳{Number(log.refundAmount || 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. SUMMARY & FINANCIAL BREAKDOWN */}
        <div className="grid grid-cols-12 gap-6 mb-4 pt-2 border-t border-slate-200 print:break-inside-avoid">
          <div className="col-span-7 space-y-3">
            <div>
              <span className="font-extrabold uppercase text-slate-400 text-[9px] block mb-0.5">
                Refund Amount In Words
              </span>
              <p className="font-bold text-slate-900 italic text-xs leading-snug">
                {numberToWordsBD(totalRefund)}
              </p>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-700 uppercase text-[9px] block">
                Official Voucher Note:
              </span>
              <p className="text-[10px] leading-relaxed text-slate-500">
                This Return Credit Note officially adjusts original sale invoice #{sale?.invoiceNumber}.
                Returned items have been inspected, accepted, and recorded back into inventory.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="bg-white p-1 rounded border border-slate-200 shrink-0">
                <QRCodeCanvas value={qrData} size={56} />
              </div>
              <div className="shrink-0 overflow-hidden">
                <BarcodeCanvas value={creditNoteNumber} width={1.2} height={26} />
              </div>
            </div>
          </div>

          <div className="col-span-5 space-y-1 text-xs">
            <div className="flex justify-between py-1 text-slate-600">
              <span>Original Invoice Net:</span>
              <span className="font-mono font-semibold text-slate-800">
                ৳{Number(sale?.netTotal || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between py-1 text-rose-600 font-bold border-t border-slate-200">
              <span>Total Refund Deducted:</span>
              <span className="font-mono">-৳{Number(totalRefund || 0).toLocaleString()}</span>
            </div>

            <div className="flex justify-between py-1.5 border-t-2 border-slate-900 text-slate-900 font-extrabold text-sm">
              <span>Revised Net Invoice:</span>
              <span className="font-mono text-emerald-700">
                ৳
                {Math.max(
                  0,
                  (Number(sale?.netTotal) || 0) - (Number(sale?.returnedAmount) || totalRefund)
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. FOOTER & SIGNATURES */}
      <div className="print:break-inside-avoid">
        <div className="grid grid-cols-2 gap-8 pt-10 border-t border-slate-200 text-center text-xs">
          <div className="space-y-1">
            <div className="border-t border-slate-400 w-3/4 mx-auto pt-1.5 font-bold text-slate-800">
              Customer Signature
            </div>
            <p className="text-[10px] text-slate-400">Refund Received & Verified</p>
          </div>
          <div className="space-y-1">
            <div className="border-t border-slate-400 w-3/4 mx-auto pt-1.5 font-bold text-slate-800">
              Authorized Seal & Signature
            </div>
            <p className="text-[10px] text-slate-400">Processed into System Inventory</p>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-3 mt-3 border-t border-slate-100">
          <p>
            Omni-Manage ERP Sales Solutions • Issued on {returnDate.toLocaleString('en-BD')}
          </p>
          <p>Official Sales Return Voucher</p>
        </div>
      </div>
    </div>
  );
}
