import React, { useRef, useState } from 'react';
import {
  Printer,
  X,
  ShieldAlert,
  ShieldCheck,
  User,
  Phone,
  Smartphone,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import {
  useCompanyInfo,
  BarcodeCanvas,
  QRCodeCanvas,
} from '../sales/Invoice';
import { getAssetUrl } from '../../lib/api';
import { executeClientPrint } from '../../utils/invoiceGenerator';

export default function WarrantyClaimSlipModal({ claim, onClose }) {
  const [printSize, setPrintSize] = useState('a4');
  const componentRef = useRef(null);
  const companyInfo = useCompanyInfo();

  if (!claim) return null;

  const claimNumber =
    claim.claimNumber ||
    `CLM-${String(claim.id || claim._id || '')
      .slice(-6)
      .toUpperCase()}`;
  const claimDate = claim.createdAt ? new Date(claim.createdAt) : new Date();

  const customerName =
    claim.customer?.name || claim.customerId?.name || claim.customerName || 'Walk-in Customer';
  const customerPhone =
    claim.customer?.phone || claim.customerId?.phone || claim.customerPhone || 'N/A';
  const customerEmail =
    claim.customer?.email || claim.customerId?.email || claim.customerEmail || '';
  const customerAddress =
    claim.customer?.address || claim.customerId?.address || claim.customerAddress || '';

  const invoiceNumber =
    claim.invoiceRef?.invoiceNumber || claim.notes?.match(/INV-[\w-]+/)?.[0] || '—';
  const productName = claim.notes?.startsWith('Item:')
    ? claim.notes.replace(/^Item:\s*/i, '')
    : claim.notes?.startsWith('Sold via')
      ? claim.notes.split('—')[0]
      : claim.productId?.name || claim.imei?.productId?.name || claim.productName || 'Gadget Item';
  const brand = claim.productId?.brand || claim.brand || 'Original Brand';
  const imei =
    claim.imei?.imeiOrSerial ||
    claim.imeiOrSerial ||
    claim.imei ||
    claim.serialNumber ||
    'Non-IMEI Item';
  const reason =
    claim.description ||
    claim.reason ||
    claim.issueDescription ||
    claim.problem ||
    'Customer reported device issue/defect';
  const status = (claim.status || 'pending').toLowerCase();
  const resolution =
    claim.resolution || claim.actionTaken || claim.notes || 'Under Technical Assessment';

  const loggedBy =
    claim.createdByName ||
    claim.createdBy?.fullName ||
    claim.createdBy?.name ||
    claim.createdBy ||
    'Service Desk';

  const handlePrint = () => {
    executeClientPrint(componentRef.current, claimNumber, printSize);
  };

  const getStatusStamp = () => {
    switch (status) {
      case 'resolved':
      case 'repaired':
      case 'replaced':
      case 'completed':
        return { label: status.toUpperCase(), color: 'border-emerald-600 text-emerald-700 bg-emerald-50' };
      case 'in_progress':
      case 'processing':
        return { label: 'IN PROGRESS', color: 'border-blue-600 text-blue-700 bg-blue-50' };
      case 'rejected':
      case 'void':
        return { label: 'VOID / REJECTED', color: 'border-rose-600 text-rose-700 bg-rose-50' };
      default:
        return { label: 'PENDING INTAKE', color: 'border-amber-600 text-amber-700 bg-amber-50' };
    }
  };

  const statusStamp = getStatusStamp();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Control Header */}
        <div className="p-4 sm:px-6 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/15 text-amber-400 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Warranty Claim Receipt & Token
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-amber-950 text-amber-400 border border-amber-800">
                  {claimNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Customer warranty acknowledgement token & service record
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
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> A4 Slip
              </button>
              <button
                type="button"
                onClick={() => setPrintSize('thermal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  printSize === 'thermal'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> POS 80mm
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 h-10 px-5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 shrink-0"
            >
              <Printer className="w-4 h-4" /> Print Claim Token
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
              className="printable-invoice-container printable-slip bg-white text-slate-900 p-4 sm:p-6 md:p-8 w-full max-w-[210mm] min-h-[276mm] mx-auto flex flex-col justify-between shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-2 sm:print:p-4 print:max-w-none print:w-full print:min-h-[276mm] print:flex print:flex-col print:justify-between"
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
                          <strong>Hotline:</strong> {companyInfo.phone}
                        </span>
                      )}
                      {companyInfo.email && (
                        <>
                          <span>•</span>
                          <span>
                            <strong>Support:</strong> {companyInfo.email}
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
                    <div className="text-sm font-black tracking-wider uppercase text-amber-700 border-b-2 border-slate-900 pb-0.5">
                      OFFICIAL WARRANTY CLAIM TOKEN
                    </div>
                    <div className="pt-0.5">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        Claim Token No
                      </p>
                      <p className="text-lg font-mono font-bold text-slate-900 tracking-tight">
                        {claimNumber}
                      </p>
                    </div>
                    <div className="text-xs text-slate-600 leading-tight space-y-0.5">
                      <p>
                        <strong>Date:</strong>{' '}
                        {claimDate.toLocaleDateString('en-BD', {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                        })}
                      </p>
                      <p>
                        <strong>Time:</strong>{' '}
                        {claimDate.toLocaleTimeString('en-BD', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-xs font-semibold text-slate-700">
                        Logged By: {loggedBy}
                      </p>
                    </div>
                  </div>
                </div>

                <hr className="border-t-2 border-slate-900 my-3" />

                {/* 2. CUSTOMER & CLAIMED DEVICE DETAILS */}
                <div className="grid grid-cols-12 gap-4 mb-4 pb-2 border-b border-slate-200 print:break-inside-avoid">
                  {/* Customer Information */}
                  <div className="col-span-7 space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5 flex items-center gap-1">
                      <User className="w-3 h-3 text-amber-600 inline" /> Claimant / Customer Details
                    </span>
                    <p className="font-extrabold text-slate-900 text-sm">{customerName}</p>
                    <p className="text-xs text-slate-600 font-mono">Mobile: {customerPhone}</p>
                    {customerEmail && (
                      <p className="text-xs text-slate-500">Email: {customerEmail}</p>
                    )}
                    {customerAddress && (
                      <p className="text-xs text-slate-500">Address: {customerAddress}</p>
                    )}
                    {invoiceNumber !== '—' && (
                      <p className="text-xs text-slate-700 font-semibold pt-0.5">
                        Linked Purchase Invoice: <span className="font-mono">{invoiceNumber}</span>
                      </p>
                    )}
                  </div>

                  {/* Device Specification & Status */}
                  <div className="col-span-5 flex flex-col justify-between items-end text-right">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5 flex items-center justify-end gap-1">
                        <Smartphone className="w-3 h-3 text-amber-600 inline" /> Claimed Device
                      </span>
                      <p className="font-bold text-slate-900 text-xs">{productName}</p>
                      <p className="text-[11px] text-slate-600">Brand: {brand}</p>
                      <p className="text-[11px] font-mono font-bold text-purple-700">
                        IMEI / Serial: {imei}
                      </p>
                    </div>

                    <div
                      className={`border-2 ${statusStamp.color} font-black text-xs px-3.5 py-1 rounded uppercase tracking-wider text-center mt-2`}
                    >
                      {statusStamp.label}
                    </div>
                  </div>
                </div>

                {/* 3. REPORTED FAULT / SYMPTOMS */}
                <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200 print:break-inside-avoid space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Reported Problem / Issue Symptoms
                  </div>
                  <p className="text-xs text-slate-900 leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-200">
                    {reason}
                  </p>
                </div>

                {/* 4. TECHNICAL ASSESSMENT & RESOLUTION */}
                <div className="mb-4 bg-blue-50/60 p-4 rounded-xl border border-blue-200/80 print:break-inside-avoid space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Service Assessment & Resolution Notes
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-3 rounded-lg border border-blue-100">
                    {resolution}
                  </p>
                </div>

                {/* 5. QR CODE & BARCODE */}
                <div className="grid grid-cols-12 gap-4 mb-4 pt-2 border-t border-slate-200 print:break-inside-avoid items-center">
                  <div className="col-span-8">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                      <p className="font-bold text-slate-800">Warranty Terms & Policy Notice:</p>
                      <p className="text-[10px] leading-snug text-slate-500">
                        • This physical token or digital SMS reference is mandatory to collect the serviced/replaced item.
                      </p>
                      <p className="text-[10px] leading-snug text-slate-500">
                        • Warranty is void if there are signs of liquid damage, unauthorized physical repairs, broken display/housing, or burned PCB components.
                      </p>
                      <p className="text-[10px] leading-snug text-slate-500">
                        • Standard turnaround time is 3 to 10 working days depending on official brand service centers.
                      </p>
                    </div>
                  </div>

                  <div className="col-span-4 flex flex-col items-center justify-center space-y-1.5">
                    <div className="bg-white p-1 rounded border border-slate-200">
                      <QRCodeCanvas
                        value={`CLAIM: ${claimNumber} | Device: ${productName} | IMEI: ${imei} | Status: ${status}`}
                        size={64}
                      />
                    </div>
                    <BarcodeCanvas value={claimNumber} width={1.2} height={26} />
                  </div>
                </div>
              </div>

              {/* 6. FOOTER & SIGNATURES */}
              <div className="print:break-inside-avoid">
                <div className="grid grid-cols-2 gap-8 pt-10 border-t border-slate-200 text-center text-xs">
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 w-3/4 mx-auto pt-1.5 font-bold text-slate-800">
                      Customer Signature
                    </div>
                    <p className="text-[10px] text-slate-400">Device Handover Acknowledged</p>
                  </div>
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 w-3/4 mx-auto pt-1.5 font-bold text-slate-800">
                      Service Center In-Charge / Authorized Staff
                    </div>
                    <p className="text-[10px] text-slate-400">Received & Tagged in System</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-3 mt-3 border-t border-slate-100">
                  <p>
                    Omni-Manage ERP Warranty Solutions • Printed on {new Date().toLocaleString('en-BD')}
                  </p>
                  <p>Official Warranty Document</p>
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
                  WARRANTY TOKEN
                </div>
                <p className="font-bold text-xs">{claimNumber}</p>
                <p className="text-[10px]">{claimDate.toLocaleDateString('en-BD')}</p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                <p>
                  <strong>CUSTOMER:</strong> {customerName}
                </p>
                <p>
                  <strong>PHONE:</strong> {customerPhone}
                </p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                <p>
                  <strong>DEVICE:</strong> {productName}
                </p>
                <p>
                  <strong>IMEI:</strong> {imei}
                </p>
                <p>
                  <strong>STATUS:</strong> {status.toUpperCase()}
                </p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 text-[10px]">
                <p className="font-bold">PROBLEM:</p>
                <p>{reason}</p>
              </div>

              <div className="pt-6 pb-2 text-center text-[10px] space-y-4">
                <div className="border-t border-slate-400 pt-1">Customer Signature</div>
                <p className="text-[9px] text-slate-400">Please bring token for collection</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
