import React, { useRef, useState } from 'react';
import { Printer, X, CheckCircle, Clock, Truck, ArrowRight, Building2, Package, ShieldCheck } from 'lucide-react';
import { useCompanyInfo, QRCodeCanvas } from '../sales/Invoice';

export default function TransferChallanModal({ transfer, onClose }) {
  const [printSize, setPrintSize] = useState('a4'); // 'a4' or 'thermal'
  const componentRef = useRef(null);
  const companyInfo = useCompanyInfo();

  if (!transfer) return null;

  const transferNo = transfer.transferNumber || `TRF-${String(transfer.id || transfer._id || '').slice(-6).toUpperCase()}`;
  const transferDate = transfer.createdAt ? new Date(transfer.createdAt) : new Date();
  
  const fromBranchName = transfer.fromBranchId?.name || transfer.fromBranch || 'Main Branch';
  const toBranchName = transfer.toBranchId?.name || transfer.toBranch || 'Destination Branch';
  const productName = transfer.productId?.name || transfer.product?.name || 'Transferred Item';
  const productSku = transfer.productId?.sku || transfer.product?.sku || 'N/A';
  const productCategory = transfer.productId?.category || transfer.product?.category || 'General';
  const quantity = transfer.quantity || 1;
  const imei = transfer.imeiOrSerial || null;

  const handlePrint = () => {
    window.print();
  };

  const qrData = JSON.stringify({
    challan: transferNo,
    from: fromBranchName,
    to: toBranchName,
    product: productName,
    qty: quantity,
    date: transferDate.toISOString().split('T')[0]
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Control Header */}
        <div className="p-4 sm:px-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Stock Transfer Gate Pass / Challan
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-blue-950 text-blue-400 border border-blue-800">
                  {transferNo}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Official inter-branch transfer document & delivery proof</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setPrintSize('a4')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  printSize === 'a4' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                A4 Slip
              </button>
              <button
                type="button"
                onClick={() => setPrintSize('thermal')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  printSize === 'thermal' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                POS 80mm
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md active:scale-95"
            >
              <Printer className="w-4 h-4" /> Print Challan
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
                      {companyInfo.address} {companyInfo.phone && `• Tel: ${companyInfo.phone}`}
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="inline-block bg-blue-700 text-white font-black px-3.5 py-1 text-xs tracking-wider uppercase rounded-md shadow-xs">
                      INTER-BRANCH TRANSFER CHALLAN
                    </span>
                    <p className="text-lg font-mono font-bold text-slate-900 pt-1">{transferNo}</p>
                    <p className="text-xs text-slate-500">
                      Date: <span className="font-semibold text-slate-800">{transferDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                  </div>
                </div>

                {/* 2. Source and Destination Dispatch Boxes */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* From Branch */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      Dispatched From (Source Outlet)
                    </div>
                    <div className="text-base font-bold text-slate-900">{fromBranchName}</div>
                    <div className="text-xs text-slate-600">
                      {transfer.fromBranchId?.address || 'Main Gadget Warehouse / Outlet'}
                    </div>
                    <div className="text-xs text-slate-500">
                      Dispatched By: <span className="font-semibold text-slate-800">{transfer.sender || transfer.createdBy || 'Authorized Staff'}</span>
                    </div>
                  </div>

                  {/* To Branch */}
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider">
                      <Truck className="w-3.5 h-3.5 text-blue-700" />
                      Destination (Receiving Outlet)
                    </div>
                    <div className="text-base font-bold text-slate-900">{toBranchName}</div>
                    <div className="text-xs text-slate-600">
                      {transfer.toBranchId?.address || 'Branch Destination Store'}
                    </div>
                    <div className="text-xs text-slate-500">
                      Transfer Status:{' '}
                      <span className="font-bold uppercase px-2 py-0.5 rounded text-[11px] bg-blue-100 text-blue-800">
                        {transfer.status || 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Transferred Items Table */}
                <div className="mb-6">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                    Transferred Gadgets & Inventory Items
                  </div>
                  <table className="w-full text-left border-collapse border border-slate-200 rounded-lg overflow-hidden text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white font-semibold">
                        <th className="p-3 w-12 text-center">#</th>
                        <th className="p-3">Item Description</th>
                        <th className="p-3">Category / Brand</th>
                        <th className="p-3">SKU / Code</th>
                        <th className="p-3">IMEI / Serial Number</th>
                        <th className="p-3 text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 text-center font-bold text-slate-400">1</td>
                        <td className="p-3 font-bold text-slate-900">{productName}</td>
                        <td className="p-3 text-slate-600">{productCategory}</td>
                        <td className="p-3 font-mono text-slate-500">{productSku}</td>
                        <td className="p-3">
                          {imei ? (
                            <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              {imei}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Standard Stock Batch</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-sm text-slate-900">
                          {quantity} pcs
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                        <td colSpan={5} className="p-3 text-right uppercase text-[11px] tracking-wider">
                          Total Dispatched Quantity:
                        </td>
                        <td className="p-3 text-right font-mono font-black text-sm text-blue-700">
                          {quantity} units
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* 4. Transfer Reason / Notes */}
                {transfer.notes && (
                  <div className="p-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 mb-6 text-xs text-slate-700">
                    <span className="font-bold text-slate-900">Transfer Remarks / Notes:</span> {transfer.notes}
                  </div>
                )}

                {/* 5. Verification Notice */}
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 mb-6">
                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="font-bold">Inter-Branch Dispatch Verification & Handover Policy</p>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      The receiving branch must verify device physical condition and match IMEI/Serial numbers before acknowledging delivery on the ERP portal.
                    </p>
                  </div>
                </div>
              </div>

              {/* 6. Footer & 3-Party Signatures */}
              <div>
                <div className="grid grid-cols-3 gap-6 pt-12 border-t border-slate-200 text-center text-xs">
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 w-3/4 mx-auto pt-1.5 font-bold text-slate-800">
                      Dispatched By
                    </div>
                    <p className="text-[10px] text-slate-400">Source Store Officer</p>
                  </div>
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 w-3/4 mx-auto pt-1.5 font-bold text-slate-800">
                      Courier / Gate Pass
                    </div>
                    <p className="text-[10px] text-slate-400">Transport & Transit</p>
                  </div>
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 w-3/4 mx-auto pt-1.5 font-bold text-slate-800">
                      Received & Verified By
                    </div>
                    <p className="text-[10px] text-slate-400">Destination Branch Manager</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-4 mt-4 border-t border-slate-100">
                  <p>Omni-Manage ERP Stock Solutions • Generated on {new Date().toLocaleString()}</p>
                  <p>Page 1 of 1</p>
                </div>
              </div>
            </div>
          ) : (
            /* POS 80mm Thermal Receipt Format */
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
                  TRANSFER CHALLAN
                </div>
                <p className="font-bold text-xs">{transferNo}</p>
                <p className="text-[10px]">{transferDate.toLocaleString()}</p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-1">
                <p><strong>FROM:</strong> {fromBranchName}</p>
                <p><strong>TO:</strong> {toBranchName}</p>
                <p><strong>STATUS:</strong> {transfer.status || 'PENDING'}</p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400">
                <div className="flex justify-between font-bold text-[10px] mb-1">
                  <span>ITEM</span>
                  <span>QTY</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold">
                  <span>{productName}</span>
                  <span>×{quantity}</span>
                </div>
                {imei && <div className="text-[9px] text-slate-600">IMEI: {imei}</div>}
              </div>

              {transfer.notes && (
                <div className="py-1 text-[10px] border-b border-dashed border-slate-400 italic">
                  Note: {transfer.notes}
                </div>
              )}

              <div className="pt-6 pb-2 text-center text-[10px] space-y-4">
                <div className="border-t border-slate-400 pt-1">
                  Dispatched By
                </div>
                <div className="border-t border-slate-400 pt-1">
                  Received By (Signature)
                </div>
                <p className="text-[9px] text-slate-400">Omni-Manage ERP</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
