import { Camera, QrCode, ScanBarcode, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Html5Qrcode } from 'html5-qrcode';

export default function BarcodeScannerModal({ open, onScan, onClose }) {
  const scannerRef = useRef(null);
  const containerRef = useRef(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!open || !containerRef.current) return;

    let scanner = null;
    let stopped = false;

    const startScanner = async () => {
      try {
        scanner = new Html5Qrcode('barcode-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 150 },
            aspectRatio: 2.0,
            formatsToSupport: undefined,
          },
          (decodedText, decodedResult) => {
            if (!stopped) {
              onScan(decodedText);
              stopScanner();
            }
          },
          () => {}
        );
        if (!stopped) setScanning(true);
      } catch (err) {
        if (!stopped) {
          setError(err?.message || 'Camera access denied or not available');
        }
      }
    };

    const stopScanner = async () => {
      stopped = true;
      if (scannerRef.current) {
        try {
          const state = scannerRef.current.getState();
          if (state === 2) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch {}
        scannerRef.current = null;
      }
      setScanning(false);
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [open, onScan]);

  const handleClose = () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan QR Code / Barcode / IMEI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black">
                <div id="barcode-reader" ref={containerRef} className="w-full min-h-[280px]" />
                {!scanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
                  </div>
                )}
                {scanning && (
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-center gap-2 pointer-events-none">
                    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-semibold text-white uppercase tracking-wide">
                        Scanning
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Code</span>
                </div>
                <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
                <div className="flex items-center gap-1.5">
                  <ScanBarcode className="w-3.5 h-3.5" />
                  <span>Barcode</span>
                </div>
                <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
                <span className="font-mono text-[10px]">IMEI</span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
