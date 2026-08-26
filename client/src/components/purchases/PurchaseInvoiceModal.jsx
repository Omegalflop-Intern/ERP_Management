import React, { useRef, useState } from 'react';
import { Printer, X, ShoppingBag, Truck, Building2, User, Phone, CheckCircle, CreditCard, DollarSign } from 'lucide-react';
import { useCompanyInfo, QRCodeCanvas } from '../sales/Invoice';

export default function PurchaseInvoiceModal({ po, onClose }) {
  const [printSize, setPrintSize] = useState('a4'); // 'a4' or 'thermal'
  const componentRef = useRef(null);
  const companyInfo = useCompanyInfo();

  if (!po) return null;

  const poNumber = po.poNumber || `PO-${String(po.id || po._id || '').slice(-6).toUpperCase()}`;
  const orderDate = po.createdAt ? new Date(po.createdAt) : (po.orderDate ? new Date(po.orderDate) : new Date());
  
  const supplierName = po.supplierId?.name || po.supplierName || 'Walk-in / Direct Vendor';
  const supplierCompany = po.supplierId?.company || po.supplierCompany || '';
  const supplierPhone = po.supplierId?.phone || po.supplierPhone || 'N/A';
  const supplierAddress = po.supplierId?.address || po.supplierAddress || '';

  const lineItems = po.items || po.lineItems || [];
  const subTotal = Number(po.subTotal || po.totalCost || 0);
  const discount = Number(po.discount || 0);
  const tax = Number(po.tax || 0);
  const netTotal = Number(po.netTotal || (subTotal - discount + tax) || 0);
  const paidAmount = Number(po.paidAmount || 0);
  const dueAmount = Number(po.dueAmount || Math.max(0, netTotal - paidAmount));
  const paymentMethod = po.paymentMethod || 'CASH';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Control Top Header */}
        <div className="p-4 sm:px-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Purchase Order / Goods Receipt Invoice
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {poNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Supplier procurement bill, landed costs & payment receipt</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setPrintSize('a4')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  printSize === 'a4' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                A4 Bill
              </button>
              <button
                type="button"
                onClick={() => setPrintSize('thermal')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  printSize === 'thermal' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                POS 80mm
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md active:scale-95"
            >
              <Printer className="w-4 h-4" /> Print Purchase Invoice
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable View Area */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-950 flex justify-center">
          
          {/* A4 Format Document */}
          {printSize === 'a4' ? (
            <div
              ref={componentRef}
              className="bg-white text-slate-900 p-8 w-full max-w-[210mm] min-h-[270mm] rounded-xl shadow-xl flex flex-col justify-between print:shadow-none print:p-4 print:max-w-none print:w-full print:min-h-[270mm]"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              <div>
                {/* 1. Header Branding & Document Title */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                  <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">{companyInfo.name}</h1>
                    {companyInfo.slogan && (
                      <p className="text-xs font-medium text-slate-600">{companyInfo.slogan}</p>
                    )}
                    <p className="text-xs text-slate-500 max-w-sm">
                      {companyInfo.address} {companyInfo.phone && `• Phone: ${companyInfo.phone}`}
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="inline-block bg-emerald-700 text-white font-black px-3.5 py-1 text-xs tracking-wider uppercase rounded-md shadow-xs">
                      PURCHASE ORDER & GOODS RECEIPT
                    </span>
                    <p className="text-lg font-mono font-bold text-slate-900 pt-1">{poNumber}</p>
                    <p className="text-xs text-slate-500">
                      Date:{' '}
                      <span className="font-semibold text-slate-800">
                        {orderDate.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </p>
                  </div>
                </div>

                {/* 2. Supplier & Branch Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Supplier Box */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <Truck className="w-3.5 h-3.5 text-emerald-600" />
                      Vendor / Supplier Information
                    </div>
                    <div className="text-base font-bold text-slate-900">
                      {supplierName} {supplierCompany && `(${supplierCompany})`}
                    </div>
                    <div className="text-xs text-slate-600">
                      {supplierAddress || 'Verified Hardware & Gadget Supplier'}
                    </div>
                    <div className="text-xs text-slate-500">
                      Contact: <span className="font-semibold text-slate-800">{supplierPhone}</span>
                    </div>
                  </div>

                  {/* Receiving Outlet */}
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      Receiving Outlet / Store
                    </div>
                    <div className="text-base font-bold text-slate-900">
                      {po.branchId?.name || po.branchName || companyInfo.name}
                    </div>
                    <div className="text-xs text-slate-600">
                      Procured By: <span className="font-semibold text-slate-800">{po.createdBy || 'Admin'}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      PO Status:{' '}
                      <span className="font-bold uppercase px-2 py-0.5 rounded text-[11px] bg-emerald-100 text-emerald-800">
                        {po.status || 'RECEIVED'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Procured Line Items Table */}
                <div className="mb-6">
                  <table className="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white font-semibold">
                        <th className="p-3 w-10 text-center">#</th>
                        <th className="p-3">Product Description & IMEIs</th>
                        <th className="p-3 text-right">Unit Cost</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Retail (৳)</th>
                        <th className="p-3 text-right">Wholesale (৳)</th>
                        <th className="p-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {lineItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-400">
                            No item details found
                          </td>
                        </tr>
                      ) : (
                        lineItems.map((item, idx) => {
                          const pName = item.productId?.name || item.name || item.productName || 'Gadget Item';
                          const uCost = Number(item.unitCost || item.costPrice || 0);
                          const qty = Number(item.qty || item.quantity || 1);
                          const lineTot = Number(item.totalPrice || item.totalCost || (uCost * qty));
                          const imeis = item.imeis || item.imeiList || [];

                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                              <td className="p-3">
                                <div className="font-bold text-slate-900">{pName}</div>
                                {imeis.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {imeis.map((im, i) => (
                                      <span key={i} className="text-[10px] font-mono font-semibold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                                        {im}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-right font-mono font-semibold text-slate-800">
                                ৳{uCost.toLocaleString()}
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-slate-900">
                                {qty}
                              </td>
                              <td className="p-3 text-right font-mono text-slate-600">
                                {Number(item.sellingPrice || 0) > 0 ? `৳${Number(item.sellingPrice).toLocaleString()}` : '-'}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-indigo-700">
                                {Number(item.wholesalePrice || 0) > 0 ? `৳${Number(item.wholesalePrice).toLocaleString()}` : '-'}
                              </td>
                              <td className="p-3 text-right font-mono font-black text-slate-900">
                                ৳{lineTot.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 4. Financial Summary Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Payment & Remarks Details */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      Payment & Settlement Details
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Payment Method:</span>
                      <span className="font-bold text-slate-800 uppercase">{paymentMethod}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Settlement Status:</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        dueAmount <= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {dueAmount <= 0 ? 'PAID IN FULL' : 'PARTIAL / DUE OUTSTANDING'}
                      </span>
                    </div>
                    {po.notes && (
                      <div className="pt-1 text-[11px] text-slate-600 italic">
                        <strong>Notes:</strong> {po.notes}
                      </div>
                    )}
                  </div>

                  {/* Totals Table */}
                  <div className="space-y-1.5 text-xs text-right">
                    <div className="flex justify-between p-1.5 px-3 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-500">Gross Purchases Subtotal:</span>
                      <span className="font-mono font-bold text-slate-800">৳{subTotal.toLocaleString()}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between p-1.5 px-3 rounded-lg bg-red-50/60 text-red-700 border border-red-100">
                        <span>Supplier Discount:</span>
                        <span className="font-mono font-bold">-৳{discount.toLocaleString()}</span>
                      </div>
                    )}
                    {tax > 0 && (
                      <div className="flex justify-between p-1.5 px-3 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-500">VAT / Tax:</span>
                        <span className="font-mono font-bold text-slate-800">+৳{tax.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between p-2 px-3 rounded-xl bg-slate-900 text-white font-bold text-sm">
                      <span>Net Order Total:</span>
                      <span className="font-mono text-emerald-400">৳{netTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-1.5 px-3 rounded-lg bg-emerald-50 text-emerald-800 font-semibold">
                      <span>Amount Paid:</span>
                      <span className="font-mono font-bold">৳{paidAmount.toLocaleString()}</span>
                    </div>
                    {dueAmount > 0 && (
                      <div className="flex justify-between p-1.5 px-3 rounded-lg bg-red-100 text-red-800 font-bold">
                        <span>Supplier Balance Due:</span>
                        <span className="font-mono">৳{dueAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. Footer & Signatures */}
              <div>
                <div className="grid grid-cols-2 gap-8 pt-12 border-t border-slate-200 text-center text-xs">
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 w-2/3 mx-auto pt-1.5 font-bold text-slate-800">
                      Supplier Representative
                    </div>
                    <p className="text-[10px] text-slate-400">Goods Dispatched & Signature</p>
                  </div>
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 w-2/3 mx-auto pt-1.5 font-bold text-slate-800">
                      Store Manager / Authorized Signature
                    </div>
                    <p className="text-[10px] text-slate-400">Received, Verified & Added to Stock</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-4 mt-4 border-t border-slate-100">
                  <p>Omni-Manage ERP Purchasing Solutions • Generated on {new Date().toLocaleString()}</p>
                  <p>Page 1 of 1</p>
                </div>
              </div>
            </div>
          ) : (
            /* POS 80mm Thermal Receipt */
            <div
              ref={componentRef}
              className="bg-white text-slate-900 p-4 w-[80mm] rounded-lg shadow-xl text-xs flex flex-col justify-between print:shadow-none print:p-2 print:w-full"
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
                <p className="text-[10px]">{orderDate.toLocaleDateString()}</p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                <p><strong>SUPPLIER:</strong> {supplierName}</p>
                <p><strong>PHONE:</strong> {supplierPhone}</p>
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
                      <span>{it.qty || 1} × ৳{Number(it.unitCost || 0).toLocaleString()}</span>
                      <span className="font-bold text-slate-900">৳{Number(it.totalPrice || (it.qty * it.unitCost) || 0).toLocaleString()}</span>
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
                <div className="border-t border-slate-400 pt-1">
                  Receiver Signature
                </div>
                <p className="text-[9px] text-slate-400">Omni-Manage ERP Purchasing</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
