import React, { useRef, useState } from 'react';
import {
  Printer,
  X,
  ShoppingBag,
  Truck,
  Building2,
  FileText,
  Smartphone,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  useCompanyInfo,
  BarcodeCanvas,
  QRCodeCanvas,
  numberToWordsBD,
} from '../sales/Invoice';
import { getAssetUrl } from '../../lib/api';
import { executeClientPrint } from '../../utils/invoiceGenerator';

export default function PurchaseInvoiceModal({ po, onClose }) {
  const [printSize, setPrintSize] = useState('a4'); // 'a4' or 'thermal'
  const componentRef = useRef(null);
  const companyInfo = useCompanyInfo();

  if (!po) return null;

  const poNumber =
    po.poNumber ||
    `PO-${String(po.id || po._id || '')
      .slice(-6)
      .toUpperCase()}`;
  const orderDate = po.createdAt
    ? new Date(po.createdAt)
    : po.orderDate
      ? new Date(po.orderDate)
      : new Date();

  const supplierName = po.supplierId?.name || po.supplierName || 'Walk-in / Direct Vendor';
  const supplierCompany = po.supplierId?.company || po.supplierCompany || '';
  const supplierPhone = po.supplierId?.phone || po.supplierPhone || 'N/A';
  const supplierEmail = po.supplierId?.email || po.supplierEmail || '';
  const supplierAddress = po.supplierId?.address || po.supplierAddress || '';

  const lineItems = po.items || po.lineItems || [];
  const subTotal = Number(po.subTotal || po.totalCost || 0);
  const discount = Number(po.discount || 0);
  const tax = Number(po.tax || 0);
  const netTotal = Number(po.netTotal || subTotal - discount + tax || 0);
  const paidAmount = Number(po.paidAmount || 0);
  const dueAmount = Number(po.dueAmount || Math.max(0, netTotal - paidAmount));
  const paymentMethod = po.paymentMethod || 'CASH';

  const procuredBy =
    po.createdByName ||
    po.createdBy?.fullName ||
    po.createdBy?.name ||
    po.createdBy ||
    'Authorized Staff';

  const handlePrint = () => {
    executeClientPrint(componentRef.current, poNumber, printSize);
  };

  const getStatusBadge = () => {
    if (dueAmount <= 0) {
      return { label: 'PAID IN FULL', color: 'border-emerald-600 text-emerald-700 bg-emerald-50' };
    }
    if (paidAmount > 0) {
      return { label: 'PARTIAL PAID', color: 'border-blue-600 text-blue-700 bg-blue-50' };
    }
    return { label: 'DUE / UNPAID', color: 'border-rose-600 text-rose-700 bg-rose-50' };
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Control Header */}
        <div className="p-4 sm:px-6 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/15 text-emerald-400 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Purchase Order / Goods Receipt Bill
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {poNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Supplier procurement bill, landed costs & payment receipt
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setPrintSize('a4')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  printSize === 'a4'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> A4 Bill
              </button>
              <button
                type="button"
                onClick={() => setPrintSize('thermal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  printSize === 'thermal'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> POS 80mm
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 h-10 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 shrink-0"
            >
              <Printer className="w-4 h-4" /> Print Purchase Invoice
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable View Area */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-950/60 flex justify-center print:p-0 print:bg-white">
          {/* A4 Format Document */}
          {printSize === 'a4' ? (
            <div
              ref={componentRef}
              data-printable="true"
              className="printable-invoice-container printable-bill bg-white text-slate-900 p-4 sm:p-6 md:p-8 w-full max-w-[210mm] min-h-[276mm] mx-auto flex flex-col justify-between shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-2 sm:print:p-4 print:max-w-none print:w-full print:min-h-[276mm] print:flex print:flex-col print:justify-between"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              <div>
                {/* 1. TOP BRANDING & DOCUMENT TITLE */}
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
                          <p className="text-xs font-medium text-slate-500 mt-0.5">
                            {companyInfo.slogan}
                          </p>
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
                    <div className="text-sm font-black tracking-wider uppercase text-emerald-700 border-b-2 border-slate-900 pb-0.5">
                      PURCHASE INVOICE & GOODS RECEIPT
                    </div>
                    <div className="pt-0.5">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        PO / Bill No
                      </p>
                      <p className="text-lg font-mono font-bold text-slate-900 tracking-tight">
                        {poNumber}
                      </p>
                    </div>
                    <div className="text-xs text-slate-600 leading-tight space-y-0.5">
                      <p>
                        <strong>Date:</strong>{' '}
                        {orderDate.toLocaleDateString('en-BD', {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                        })}
                      </p>
                      <p>
                        <strong>Time:</strong>{' '}
                        {orderDate.toLocaleTimeString('en-BD', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-xs font-semibold text-slate-700">
                        Procured By: {procuredBy}
                      </p>
                    </div>
                  </div>
                </div>

                <hr className="border-t-2 border-slate-900 my-3" />

                {/* 2. VENDOR & RECEIVING STORE DETAILS */}
                <div className="grid grid-cols-12 gap-4 mb-4 pb-2 border-b border-slate-200 print:break-inside-avoid">
                  {/* Supplier Details */}
                  <div className="col-span-7 space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5 flex items-center gap-1">
                      <Truck className="w-3 h-3 text-emerald-600 inline" /> Vendor / Supplier
                      Information
                    </span>
                    <p className="font-extrabold text-slate-900 text-sm">
                      {supplierName} {supplierCompany && `(${supplierCompany})`}
                    </p>
                    <p className="text-xs text-slate-600 font-mono">Phone: {supplierPhone}</p>
                    {supplierEmail && (
                      <p className="text-xs text-slate-500">Email: {supplierEmail}</p>
                    )}
                    {supplierAddress && (
                      <p className="text-xs text-slate-500">Address: {supplierAddress}</p>
                    )}
                  </div>

                  {/* Receiving Outlet & Status Stamp */}
                  <div className="col-span-5 flex flex-col justify-between items-end text-right">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5 flex items-center justify-end gap-1">
                        <Building2 className="w-3 h-3 text-emerald-600 inline" /> Receiving Store
                      </span>
                      <p className="font-bold text-slate-900 text-xs">
                        {po.branchId?.name || po.branchName || companyInfo.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        PO Status:{' '}
                        <span className="font-semibold uppercase text-emerald-800">
                          {po.status || 'RECEIVED'}
                        </span>
                      </p>
                    </div>

                    <div
                      className={`border-2 ${statusBadge.color} font-black text-xs px-3.5 py-1 rounded uppercase tracking-wider text-center mt-2`}
                    >
                      {statusBadge.label}
                      {dueAmount > 0 && (
                        <span className="block text-[9px] tracking-normal font-bold">
                          Due: ৳{dueAmount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. PROCURED ITEMS DATA TABLE */}
                <div className="mb-4">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-y-2 border-slate-900 text-slate-900 uppercase text-[10px] font-black tracking-wider print:break-inside-avoid">
                        <th className="py-2 px-2 text-center w-8">#</th>
                        <th className="py-2 px-2">Product Description & IMEIs</th>
                        <th className="py-2 px-2 text-right w-24">Cost Price</th>
                        <th className="py-2 px-2 text-center w-12">Qty</th>
                        <th className="py-2 px-2 text-right w-24">Retail (৳)</th>
                        <th className="py-2 px-2 text-right w-24">Wholesale (৳)</th>
                        <th className="py-2 px-2 text-right w-28">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {lineItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-4 text-center text-slate-400">
                            No item details found
                          </td>
                        </tr>
                      ) : (
                        lineItems.map((item, idx) => {
                          const pName =
                            item.productId?.name || item.name || item.productName || 'Gadget Item';
                          const uCost = Number(item.unitCost || item.costPrice || 0);
                          const qty = Number(item.qty || item.quantity || 1);
                          const lineTot = Number(item.totalPrice || item.totalCost || uCost * qty);
                          const imeis = item.imeis || item.imeiList || [];

                          return (
                            <tr
                              key={idx}
                              className="hover:bg-slate-50/50 print:break-inside-avoid"
                            >
                              <td className="py-2 px-2 text-center font-bold text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-2">
                                <div className="font-bold text-slate-900 text-xs">{pName}</div>
                                {imeis.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {imeis.map((im, i) => (
                                      <span
                                        key={i}
                                        className="text-[9px] font-mono font-semibold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200"
                                      >
                                        {im}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-medium text-slate-800">
                                ৳{uCost.toLocaleString()}
                              </td>
                              <td className="py-2 px-2 text-center font-bold text-slate-800">
                                {qty}
                              </td>
                              <td className="py-2 px-2 text-right font-mono text-slate-600">
                                {Number(item.sellingPrice || 0) > 0
                                  ? `৳${Number(item.sellingPrice).toLocaleString()}`
                                  : '-'}
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-bold text-indigo-700">
                                {Number(item.wholesalePrice || 0) > 0
                                  ? `৳${Number(item.wholesalePrice).toLocaleString()}`
                                  : '-'}
                              </td>
                              <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                                ৳{lineTot.toLocaleString()}
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
                        Payment & Settlement Method
                      </span>
                      <p className="font-semibold text-slate-800 text-xs uppercase">
                        {paymentMethod}
                      </p>
                    </div>

                    <div>
                      <span className="font-extrabold uppercase text-slate-400 text-[9px] block mb-0.5">
                        Amount In Words
                      </span>
                      <p className="font-bold text-slate-900 italic text-xs leading-snug">
                        {numberToWordsBD(netTotal)}
                      </p>
                    </div>

                    {po.notes && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                        <span className="font-bold text-slate-500 uppercase text-[9px] block mb-0.5">
                          Procurement Notes:
                        </span>
                        <p className="text-slate-700 italic">{po.notes}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-1">
                      <div className="bg-white p-1 rounded border border-slate-200 shrink-0">
                        <QRCodeCanvas
                          value={`PO: ${poNumber} | Supplier: ${supplierName} | Net: Tk ${netTotal} | Due: Tk ${dueAmount}`}
                          size={56}
                        />
                      </div>
                      <div className="shrink-0 overflow-hidden">
                        <BarcodeCanvas value={poNumber} width={1.2} height={26} />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-5 space-y-1 text-xs">
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>Gross Purchases Subtotal:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        ৳{subTotal.toLocaleString()}
                      </span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between py-1 text-red-600">
                        <span>Supplier Discount:</span>
                        <span className="font-mono font-bold">-৳{discount.toLocaleString()}</span>
                      </div>
                    )}

                    {tax > 0 && (
                      <div className="flex justify-between py-1 text-slate-600">
                        <span>VAT / Tax (+):</span>
                        <span className="font-mono font-semibold text-slate-800">
                          +৳{tax.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between py-1.5 border-t-2 border-slate-900 text-slate-900 font-extrabold text-sm">
                      <span>Net Order Total:</span>
                      <span className="font-mono text-emerald-700">
                        ৳{netTotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 text-emerald-700 font-semibold border-t border-slate-200">
                      <span>Amount Paid:</span>
                      <span className="font-mono font-bold">৳{paidAmount.toLocaleString()}</span>
                    </div>

                    {dueAmount > 0 ? (
                      <div className="flex justify-between py-1 text-rose-600 font-bold bg-rose-50 px-2 rounded">
                        <span>Supplier Balance Due:</span>
                        <span className="font-mono">৳{dueAmount.toLocaleString()}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between py-1 text-emerald-700 font-bold bg-emerald-50 px-2 rounded">
                        <span>Balance Due:</span>
                        <span className="font-mono">৳0</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. FOOTER & SIGNATURES */}
              <div className="print:break-inside-avoid">
                <div className="grid grid-cols-2 gap-8 pt-10 border-t border-slate-200 text-center text-xs">
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 w-3/4 mx-auto pt-1.5 font-bold text-slate-800">
                      Supplier Representative
                    </div>
                    <p className="text-[10px] text-slate-400">Goods Dispatched & Signature</p>
                  </div>
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 w-3/4 mx-auto pt-1.5 font-bold text-slate-800">
                      Store Manager / Authorized Receiver
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Received, Verified & Added to Stock
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-3 mt-3 border-t border-slate-100">
                  <p>
                    Omni-Manage ERP Purchasing Solutions • Generated on{' '}
                    {new Date().toLocaleString('en-BD')}
                  </p>
                  <p>Official Procurement Document</p>
                </div>
              </div>
            </div>
          ) : (
            /* POS 80mm Thermal Receipt */
            <div
              ref={componentRef}
              data-printable="true"
              id="printable-receipt"
              className="printable-invoice-container bg-white text-slate-900 p-4 w-[80mm] rounded-lg shadow-xl text-xs flex flex-col justify-between print:shadow-none print:p-2 print:w-full"
              style={{ fontFamily: 'monospace' }}
            >
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <h2 className="font-bold text-sm uppercase">{companyInfo.name}</h2>
                <p className="text-[10px]">{companyInfo.address}</p>
                <p className="text-[10px]">Tel: {companyInfo.phone}</p>
                <div className="my-1.5 font-bold uppercase text-[11px] bg-slate-900 text-white py-0.5 rounded">
                  PURCHASE BILL
                </div>
                <p className="font-bold text-xs">{poNumber}</p>
                <p className="text-[10px]">{orderDate.toLocaleDateString('en-BD')}</p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                <p>
                  <strong>SUPPLIER:</strong> {supplierName}
                </p>
                <p>
                  <strong>PHONE:</strong> {supplierPhone}
                </p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 space-y-1">
                <div className="flex justify-between font-bold text-[10px]">
                  <span>ITEM</span>
                  <span>QTY × COST</span>
                  <span>TOTAL</span>
                </div>
                {lineItems.map((it, idx) => (
                  <div key={idx} className="text-[10px]">
                    <div className="font-bold">{it.productId?.name || it.name || 'Item'}</div>
                    <div className="flex justify-between text-slate-600">
                      <span>
                        {it.qty || 1} × ৳{Number(it.unitCost || 0).toLocaleString()}
                      </span>
                      <span className="font-bold text-slate-900">
                        ৳{Number(it.totalPrice || it.qty * it.unitCost || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 text-[11px] space-y-1 text-right">
                <div className="flex justify-between">
                  <span>Net Total:</span>
                  <span className="font-bold">৳{netTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Paid ({paymentMethod}):</span>
                  <span>৳{paidAmount.toLocaleString()}</span>
                </div>
                {dueAmount > 0 && (
                  <div className="flex justify-between font-bold text-red-600">
                    <span>Due Balance:</span>
                    <span>৳{dueAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="pt-6 pb-2 text-center text-[10px] space-y-4">
                <div className="border-t border-slate-400 pt-1">Receiver Signature</div>
                <p className="text-[9px] text-slate-400">Omni-Manage ERP Purchasing</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
