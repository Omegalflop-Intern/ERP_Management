import { Camera, Keyboard, QrCode, RefreshCw, ScanBarcode, Send } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Html5Qrcode } from 'html5-qrcode';

export default function BarcodeScannerModal({ open, onScan, onClose }) {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' (USB/Hardware Scanner) or 'camera'
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto focus manual input whenever modal opens or tab switches to manual
  useEffect(() => {
    if (open && activeTab === 'manual') {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [open, activeTab]);

  // Handle Camera scanner initialization only when activeTab === 'camera'
  useEffect(() => {
    if (!open || activeTab !== 'camera') {
      stopCameraScanner();
      return;
    }

    let stopped = false;
    let timerId = setTimeout(async () => {
      const el = document.getElementById('barcode-reader');
      if (!el || stopped) return;

      try {
        const devices = await Html5Qrcode.getCameras().catch(() => []);
        if (!devices || devices.length === 0) {
          setError('No camera detected. Please use USB / Manual Scanner mode.');
          return;
        }

        const scanner = new Html5Qrcode('barcode-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 160 }, aspectRatio: 1.77 },
          (decodedText) => {
            if (!stopped && decodedText) {
              onScan(decodedText.trim());
              stopCameraScanner();
              onClose();
            }
          },
          () => {}
        );

        if (!stopped) {
          setScanning(true);
          setError('');
        }
      } catch (err) {
        if (!stopped) {
          setScanning(false);
          const msg = err?.message || '';
          if (msg.includes('Permission') || msg.includes('denied')) {
            setError('Camera permission denied. Use USB / Manual Scanner mode.');
          } else {
            setError('Camera unavailable. Use USB / Manual Scanner mode.');
          }
        }
      }
    }, 200);

    return () => {
      stopped = true;
      clearTimeout(timerId);
      stopCameraScanner();
    };
  }, [open, activeTab]);

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleClose = () => {
    stopCameraScanner();
    setError('');
    setScanning(false);
    setManualCode('');
    onClose();
  };

  const handleManualSubmit = (e) => {
    if (e) e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    onScan(code);
    setManualCode('');
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6">
        <DialogHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <ScanBarcode className="w-5 h-5" />
            </div>
            <span>Scan QR / Barcode / IMEI</span>
          </DialogTitle>
        </DialogHeader>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              stopCameraScanner();
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
              activeTab === 'manual'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>USB / Hardware Scanner</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
              activeTab === 'camera'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Device Camera</span>
          </button>
        </div>

        <div className="pt-2">
          {activeTab === 'manual' ? (
            /* Mode 1: USB / Hardware Scanner & Text Input */
            <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
              <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3.5 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2.5">
                <ScanBarcode className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Hardware Barcode & IMEI Scanner Ready</p>
                  <p className="mt-0.5 text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                    Point your USB or Bluetooth barcode scanner at the product IMEI/Barcode label,
                    or manually type/paste the code below.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  IMEI / Serial / Barcode Number:
                </label>
                <div className="relative">
                  <ScanBarcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Scan or enter 15-digit IMEI / Barcode..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 font-mono font-medium focus:outline-none focus:border-blue-500 shadow-inner"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Send className="w-3.5 h-3.5" /> Auto-Add Product
                </button>
              </div>
            </form>
          ) : (
            /* Mode 2: Live Camera Viewfinder */
            <div className="space-y-3 py-1">
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-black min-h-[250px] flex items-center justify-center">
                <div id="barcode-reader" className="w-full h-full min-h-[250px]" />

                {!scanning && !error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-500 border-t-transparent mb-2.5" />
                    <p className="text-xs font-semibold text-gray-300">
                      Starting Camera Viewfinder...
                    </p>
                  </div>
                )}

                {error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-5 text-center space-y-3 z-10">
                    <Camera className="w-8 h-8 text-amber-400" />
                    <p className="text-xs text-amber-200 max-w-xs">{error}</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('manual')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md"
                    >
                      <Keyboard className="w-3.5 h-3.5" /> Switch to Hardware Scanner Mode
                    </button>
                  </div>
                )}

                {scanning && (
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-center pointer-events-none z-20">
                    <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 shadow-lg">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                        Live Camera Active
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Indicator icons */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-blue-500" />
              <span>QR Code</span>
            </div>
            <div className="w-px h-3 bg-gray-300 dark:bg-gray-700" />
            <div className="flex items-center gap-1.5">
              <ScanBarcode className="w-3.5 h-3.5 text-indigo-500" />
              <span>Barcode</span>
            </div>
            <div className="w-px h-3 bg-gray-300 dark:bg-gray-700" />
            <span className="font-mono text-[10px] font-bold text-amber-500">IMEI</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
