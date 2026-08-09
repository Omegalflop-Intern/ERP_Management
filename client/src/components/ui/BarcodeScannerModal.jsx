import { Camera, QrCode, RefreshCw, ScanBarcode, Send, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Html5Qrcode } from 'html5-qrcode';

export default function BarcodeScannerModal({ open, onScan, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [hasCamera, setHasCamera] = useState(true);

  useEffect(() => {
    if (!open) {
      setError('');
      setScanning(false);
      setManualCode('');
      return;
    }

    let stopped = false;
    let timerId = null;

    const startScanner = async () => {
      // Give DOM time to render portal element #barcode-reader
      timerId = setTimeout(async () => {
        const element = document.getElementById('barcode-reader');
        if (!element || stopped) return;

        try {
          // Check if camera devices exist
          const devices = await Html5Qrcode.getCameras().catch(() => []);
          if (!devices || devices.length === 0) {
            setHasCamera(false);
            setError('No camera found on this device. Use manual input below.');
            return;
          }

          const scanner = new Html5Qrcode('barcode-reader');
          scannerRef.current = scanner;

          await scanner.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 260, height: 160 },
              aspectRatio: 1.77,
            },
            (decodedText) => {
              if (!stopped && decodedText) {
                onScan(decodedText.trim());
                stopScanner();
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
            console.warn('Camera scanner error:', err);
            setScanning(false);
            const msg = err?.message || '';
            if (msg.includes('Permission') || msg.includes('denied')) {
              setError('Camera permission denied. Please allow camera access or use manual input.');
            } else if (msg.includes('NotFound') || msg.includes('device')) {
              setError('No active camera detected. Use manual input below.');
            } else {
              setError('Camera unavailable. You can type or paste the code below.');
            }
          }
        }
      }, 250);
    };

    startScanner();

    return () => {
      stopped = true;
      if (timerId) clearTimeout(timerId);
      stopScanner();
    };
  }, [open]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // State 2 = SCANNING
        if (state === 2) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleClose = () => {
    stopScanner();
    setError('');
    setScanning(false);
    setManualCode('');
    onClose();
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onScan(manualCode.trim());
    handleClose();
  };

  const handleRetryCamera = () => {
    setError('');
    setScanning(false);
    const element = document.getElementById('barcode-reader');
    if (element) element.innerHTML = '';
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    // Trigger re-mount scanner
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('barcode-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 160 }, aspectRatio: 1.77 },
          (decodedText) => {
            if (decodedText) {
              onScan(decodedText.trim());
              handleClose();
            }
          },
          () => {}
        );
        setScanning(true);
      } catch (err) {
        setError('Could not access camera. Please enter code manually.');
      }
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6">
        <DialogHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Camera className="w-5 h-5" />
            </div>
            <span>Scan QR Code / Barcode / IMEI</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Camera Viewport */}
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-black min-h-[260px] flex items-center justify-center">
            <div id="barcode-reader" className="w-full h-full min-h-[260px]" />

            {!scanning && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 text-center">
                <div className="animate-spin rounded-full h-9 w-9 border-3 border-blue-500 border-t-transparent mb-3" />
                <p className="text-xs font-semibold text-gray-300">Initializing Camera Scanner...</p>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-5 text-center space-y-3 z-10">
                <Camera className="w-8 h-8 text-amber-400" />
                <p className="text-xs text-amber-200 max-w-xs">{error}</p>
                {hasCamera && (
                  <button
                    type="button"
                    onClick={handleRetryCamera}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
                  </button>
                )}
              </div>
            )}

            {scanning && (
              <div className="absolute top-3 left-3 right-3 flex items-center justify-center pointer-events-none z-20">
                <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 shadow-lg">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                    Live Scanner Active
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Manual Barcode / IMEI Input Form */}
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Or Enter / Scan via USB Barcode Scanner:
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <ScanBarcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Type or paste Barcode / IMEI / Serial..."
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/80 border border-gray-300 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> Submit
              </button>
            </div>
          </form>

          {/* Indicator icons */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
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
