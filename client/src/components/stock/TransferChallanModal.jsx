import React, { useRef, useState } from 'react';
import {
  Printer,
  X,
  CheckCircle,
  Clock,
  Truck,
  ArrowRight,
  Building2,
  Package,
  ShieldCheck,
  FileText,
  Smartphone,
} from 'lucide-react';
import {
  useCompanyInfo,
  BarcodeCanvas,
  QRCodeCanvas,
} from '../sales/Invoice';
import { getAssetUrl } from '../../lib/api';
import { executeClientPrint } from '../../utils/invoiceGenerator';

export default function TransferChallanModal({ transfer, onClose }) {
  const [printSize, setPrintSize] = useState('a4'); // 'a4' or 'thermal'
  const componentRef = useRef(null);
  const companyInfo = useCompanyInfo();

  if (!transfer) return null;

  const transferNo =
    transfer.transferNumber ||
    `TRF-${String(transfer.id || transfer._id || '')
      .slice(-6)
      .toUpperCase()}`;
  const transferDate = transfer.createdAt ? new Date(transfer.createdAt) : new Date();

  const fromBranchName = transfer.fromBranchId?.name || transfer.fromBranch || 'Main Branch / Warehouse';
  const toBranchName = transfer.toBranchId?.name || transfer.toBranch || 'Destination Branch';
  const productName = transfer.productId?.name || transfer.product?.name || 'Transferred Item';
  const productSku = transfer.productId?.sku || transfer.product?.sku || 'N/A';
  const productCategory = transfer.productId?.category || transfer.product?.category || 'Gadgets';
  const quantity = transfer.quantity || 1;
  const imei = transfer.imeiOrSerial || null;

  const handlePrint = () => {
    executeClientPrint(componentRef.current, transferNo, printSize);
  };

  const statusStr = (transfer.status || 'PENDING').toUpperCase();

  const qrData = JSON.stringify({
    challan: transferNo,
    from: fromBranchName,
    to: toBranchName,
    product: productName,
    qty: quantity,
    date: transferDate.toISOString().split('T')[0],
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Control Header */}
        <div className="p-4 sm:px-6 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/15 text-blue-400 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Stock Transfer Gate Pass / Challan
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-blue-950 text-blue-400 border border-blue-800">
                  {transferNo}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official inter-branch transfer document & delivery proof
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
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> A4 Challan
              </button>
              <button
                type="button"
                onClick={() => setPrintSize('thermal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  printSize === 'thermal'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> POS 80mm
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 h-10 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 shrink-0"
            >
              <Printer className="w-4 h-4" /> Print Transfer Challan
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
              className="printable-invoice-container printable-challan bg-white text-slate-900 p-4 sm:p-6 md:p-8 w-full max-w-[210mm] min-h-[276mm] mx-auto flex flex-col justify-between shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-2 sm:print:p-4 print:max-w-none print:w-full print:min-h-[276mm] print:flex print:flex-col print:justify-between"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              <div>
                {/* 1. TOP BRANDING & CHALLAN META */}
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
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end space-y-1">
                    <div className="text-sm font-black tracking-wider uppercase text-blue-700 border-b-2 border-slate-900 pb-0.5 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-blue-700 inline" />
                      STOCK TRANSFER CHALLAN
                    </div>
                    <div className="pt-0.5">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        Challan / Pass No
                      </p>
                      <p className="text-lg font-mono font-bold text-slate-900 tracking-tight">
                        {transferNo}
                      </p>
                    </div>
                    <div className="text-xs text-slate-600 leading-tight space-y-0.5">
                      <p>
                        <strong>Date:</strong>{' '}
                        {transferDate.toLocaleDateString('en-BD', {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                        })}
                      </p>
                      <p>
                        <strong>Time:</strong>{' '}
                        {transferDate.toLocaleTimeString('en-BD', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <hr className="border-t-2 border-slate-900 my-3" />

                {/* 2. SOURCE & DESTINATION BRANCH DETAILS */}
                <div className="grid grid-cols-12 gap-4 mb-4 pb-2 border-b border-slate-200 print:break-inside-avoid">
                  {/* From Branch */}
                  <div className="col-span-6 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-blue-600 inline" /> Dispatched From (Source)
                    </span>
                    <p className="font-extrabold text-slate-900 text-sm">{fromBranchName}</p>
                    <p className="text-xs text-slate-600">
                      {transfer.fromBranchId?.address || 'Main Warehouse & Distribution Hub'}
                    </p>
                    <p className="text-xs text-slate-500 pt-0.5">
                      Dispatched By:{' '}
                      <span className="font-semibold text-slate-800">
                        {transfer.sender || transfer.createdBy || 'Authorized Staff'}
                      </span>
                    </p>
                  </div>

                  {/* To Branch */}
                  <div className="col-span-6 bg-blue-50/50 p-3 rounded-xl border border-blue-200/80 space-y-0.5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 block mb-0.5 flex items-center gap-1">
                        <Truck className="w-3 h-3 text-blue-700 inline" /> Receiving Destination (To)
                      </span>
                      <p className="font-extrabold text-slate-900 text-sm">{toBranchName}</p>
                      <p className="text-xs text-slate-600">
                        {transfer.toBranchId?.address || 'Destination Store Outlet'}
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-blue-200">
                      <span className="text-xs text-slate-500 font-medium">Status:</span>
                      <span className="font-bold uppercase px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 border border-blue-300">
                        {statusStr}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. TRANSFERRED ITEMS DATA TABLE */}
                <div className="mb-4">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-y-2 border-slate-900 text-slate-900 uppercase text-[10px] font-black tracking-wider print:break-inside-avoid">
                        <th className="py-2 px-2 text-center w-8">#</th>
                        <th className="py-2 px-2">Item Description & Specifications</th>
                        <th className="py-2 px-2">Category / Brand</th>
                        <th className="py-2 px-2 font-mono">SKU / Item Code</th>
                        <th className="py-2 px-2">IMEI / Serial Number</th>
                        <th className="py-2 px-2 text-right w-24">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr className="hover:bg-slate-50/50 print:break-inside-avoid">
                        <td className="py-2.5 px-2 text-center font-bold text-slate-400">1</td>
                        <td className="py-2.5 px-2">
                          <div className="font-bold text-slate-900 text-xs">{productName}</div>
                        </td>
                        <td className="py-2.5 px-2 text-slate-600">{productCategory}</td>
                        <td className="py-2.5 px-2 font-mono text-slate-700">{productSku}</td>
                        <td className="py-2.5 px-2 font-mono">
                          {imei ? (
                            <span className="font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 text-[11px]">
                              {imei}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">Batch Stock</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 text-sm">
                          {quantity} pcs
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-900 font-bold text-slate-900 bg-slate-50">
                        <td colSpan={5} className="py-2 px-2 text-right uppercase text-[10px] tracking-wider">
                          Total Dispatched Count:
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-black text-sm text-blue-700">
                          {quantity} units
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* 4. REMARKS & VERIFICATION NOTICE */}
                <div className="grid grid-cols-12 gap-6 mb-4 pt-2 border-t border-slate-200 print:break-inside-avoid">
                  <div className="col-span-7 space-y-2">
                    {transfer.notes && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                        <span className="font-bold text-slate-600 uppercase text-[9px] block mb-0.5">
                          Transfer Remarks / Notes:
                        </span>
                        <p className="text-slate-800 italic">{transfer.notes}</p>
                      </div>
                    )}

                    <div className="bg-blue-50/60 p-2.5 rounded-lg border border-blue-200/80 text-xs text-blue-900 space-y-0.5">
                      <span className="font-bold uppercase text-[9px] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 inline" /> Verification Policy:
                      </span>
                      <p className="text-[10px] text-blue-800 leading-snug">
                        Receiving store personnel must verify physical box seals, check accessories, and scan all IMEIs upon taking possession.
                      </p>
                    </div>
                  </div>

                  <div className="col-span-5 flex flex-col items-center justify-center space-y-1.5">
                    <div className="bg-white p-1 rounded border border-slate-200 shrink-0">
                      <QRCodeCanvas value={qrData} size={60} />
                    </div>
                    <BarcodeCanvas value={transferNo} width={1.2} height={26} />
                  </div>
                </div>
              </div>

              {/* 5. FOOTER & 3-PARTY SIGNATURES */}
              <div className="print:break-inside-avoid">
                <div className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-200 text-center text-xs">
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 w-3/4 mx-auto pt-1.5 font-bold text-slate-800">
                      Dispatched By
                    </div>
                    <p className="text-[10px] text-slate-400">Source Store Officer</p>
                  </div>
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 w-3/4 mx-auto pt-1.5 font-bold text-slate-800">
                      Courier / Transit Driver
                    </div>
                    <p className="text-[10px] text-slate-400">Gate Pass & Transport</p>
                  </div>
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 w-3/4 mx-auto pt-1.5 font-bold text-slate-800">
                      Received & Verified By
                    </div>
                    <p className="text-[10px] text-slate-400">Destination Store Manager</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-3 mt-3 border-t border-slate-100">
                  <p>
                    Omni-Manage ERP Stock Solutions • Generated on {new Date().toLocaleString('en-BD')}
                  </p>
                  <p>Official Stock Transfer Challan</p>
                </div>
              </div>
            </div>
          ) : (
            /* POS 80mm Thermal Receipt Format */
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
                  TRANSFER CHALLAN
                </div>
                <p className="font-bold text-xs">{transferNo}</p>
                <p className="text-[10px]">{transferDate.toLocaleString('en-BD')}</p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-1">
                <p>
                  <strong>FROM:</strong> {fromBranchName}
                </p>
                <p>
                  <strong>TO:</strong> {toBranchName}
                </p>
                <p>
                  <strong>STATUS:</strong> {statusStr}
                </p>
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
                <div className="border-t border-slate-400 pt-1">Dispatched By</div>
                <div className="border-t border-slate-400 pt-1">Received By (Signature)</div>
                <p className="text-[9px] text-slate-400">Omni-Manage ERP</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
