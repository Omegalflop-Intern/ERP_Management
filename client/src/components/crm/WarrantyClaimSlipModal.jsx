import React, { useRef, useState } from 'react';
import { Printer, X, ShieldAlert, ShieldCheck, User, Phone, Smartphone, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useCompanyInfo, QRCodeCanvas } from '../sales/Invoice';

export default function WarrantyClaimSlipModal({ claim, onClose }) {
  const [printSize, setPrintSize] = useState('a4');
  const componentRef = useRef(null);
  const companyInfo = useCompanyInfo();

  if (!claim) return null;

  const claimNumber = claim.claimNumber || `CLM-${String(claim.id || claim._id || '').slice(-6).toUpperCase()}`;
  const claimDate = claim.createdAt ? new Date(claim.createdAt) : new Date();
  
  const customerName = claim.customerId?.name || claim.customerName || 'Walk-in Customer';
  const customerPhone = claim.customerId?.phone || claim.customerPhone || 'N/A';
  const customerAddress = claim.customerId?.address || claim.customerAddress || '';

  const productName = claim.productId?.name || claim.productName || 'Gadget Item';
  const brand = claim.productId?.brand || claim.brand || 'Generic';
  const imei = claim.imeiOrSerial || claim.imei || claim.serialNumber || 'N/A';
  const reason = claim.reason || claim.issueDescription || claim.problem || 'Customer reported device issue/defect';
  const status = (claim.status || 'pending').toLowerCase();
  const resolution = claim.resolution || claim.actionTaken || claim.notes || 'Under Technical Assessment';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Control Header */}
        <div className="p-4 sm:px-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/10 text-amber-400 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Warranty Claim Receipt & Token
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-amber-950 text-amber-400 border border-amber-800">
                  {claimNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Customer warranty acknowledgement token & service record</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setPrintSize('a4')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  printSize === 'a4' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                A4 Slip
              </button>
              <button
                type="button"
                onClick={() => setPrintSize('thermal')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  printSize === 'thermal' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                POS 80mm
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md active:scale-95"
            >
              <Printer className="w-4 h-4" /> Print Claim Token
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
                      {companyInfo.address} {companyInfo.phone && `• Hotline: ${companyInfo.phone}`}
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="inline-block bg-amber-600 text-white font-black px-3.5 py-1 text-xs tracking-wider uppercase rounded-md shadow-xs">
                      OFFICIAL WARRANTY CLAIM TOKEN
                    </span>
                    <p className="text-lg font-mono font-bold text-slate-900 pt-1">{claimNumber}</p>
                    <p className="text-xs text-slate-500">
                      Claim Date:{' '}
                      <span className="font-semibold text-slate-800">
                        {claimDate.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </p>
                  </div>
                </div>

                {/* 2. Customer & Device Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Customer Box */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <User className="w-3.5 h-3.5 text-amber-600" />
                      Claimant / Customer Details
                    </div>
                    <div className="text-base font-bold text-slate-900">{customerName}</div>
                    <div className="text-xs text-slate-600">{customerAddress || 'Direct Store Customer'}</div>
                    <div className="text-xs text-slate-500">
                      Mobile: <span className="font-semibold text-slate-800">{customerPhone}</span>
                    </div>
                  </div>

                  {/* Device Information */}
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
                      <Smartphone className="w-3.5 h-3.5 text-amber-700" />
                      Claimed Device Specification
                    </div>
                    <div className="text-base font-bold text-slate-900">{productName}</div>
                    <div className="text-xs text-slate-600">Brand: <span className="font-semibold">{brand}</span></div>
                    <div className="text-xs font-mono font-bold text-purple-700">
                      IMEI / Serial: {imei}
                    </div>
                  </div>
                </div>

                {/* 3. Issue & Defect Specification Box */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white mb-6 space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Reported Problem / Issue Description</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-amber-100 text-amber-800">
                      Status: {status}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-800 leading-relaxed border border-slate-100">
                    {reason}
                  </div>
                </div>

                {/* 4. Assessment & Technical Resolution */}
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 mb-6 space-y-1.5 text-xs">
                  <div className="font-bold text-blue-900 uppercase text-[11px] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Service Assessment & Resolution Notes
                  </div>
                  <p className="text-slate-700 leading-relaxed">{resolution}</p>
                </div>

                {/* 5. Terms Notice */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 mb-6 space-y-1">
                  <p className="font-bold text-slate-800">Warranty Claim Policy & Customer Agreement:</p>
                  <p className="text-[11px]">
                    • This token must be produced during device collection. Physical damage, liquid exposure, or unauthorized tampering voids warranty coverage.
                  </p>
                  <p className="text-[11px]">
                    • Standard assessment duration is 3 to 7 working days depending on official brand authorized service centers.
                  </p>
                </div>
              </div>

              {/* 6. Footer & Signatures */}
              <div>
                <div className="grid grid-cols-2 gap-8 pt-12 border-t border-slate-200 text-center text-xs">
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 w-2/3 mx-auto pt-1.5 font-bold text-slate-800">
                      Customer Signature
                    </div>
                    <p className="text-[10px] text-slate-400">Device Handover Acknowledged</p>
                  </div>
                  <div className="space-y-1">
                    <div className="border-t border-slate-400 w-2/3 mx-auto pt-1.5 font-bold text-slate-800">
                      Service Center In-Charge
                    </div>
                    <p className="text-[10px] text-slate-400">Received & Tagged in System</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-4 mt-4 border-t border-slate-100">
                  <p>Omni-Manage ERP Warranty Solutions • Printed on {new Date().toLocaleString()}</p>
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
                  WARRANTY TOKEN
                </div>
                <p className="font-bold text-xs">{claimNumber}</p>
                <p className="text-[10px]">{claimDate.toLocaleDateString()}</p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                <p><strong>CUSTOMER:</strong> {customerName}</p>
                <p><strong>PHONE:</strong> {customerPhone}</p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                <p><strong>DEVICE:</strong> {productName}</p>
                <p><strong>IMEI:</strong> {imei}</p>
                <p><strong>STATUS:</strong> {status.toUpperCase()}</p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 text-[10px]">
                <p className="font-bold">PROBLEM:</p>
                <p>{reason}</p>
              </div>

              <div className="pt-6 pb-2 text-center text-[10px] space-y-4">
                <div className="border-t border-slate-400 pt-1">
                  Customer Signature
                </div>
                <p className="text-[9px] text-slate-400">Please bring token for collection</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
