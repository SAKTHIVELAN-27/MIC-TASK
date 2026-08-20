'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, QrCode, CheckCircle, XCircle, RefreshCw, Camera, KeyRound, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatTime } from '@/lib/utils';

interface ScanResult {
  type: 'success' | 'duplicate' | 'invalid' | 'offline';
  attendeeName?: string;
  registrationCode?: string;
  checkedInAt?: string;
  stationName?: string;
  message?: string;
}

interface QueuedScan {
  token: string;
  scannedAt: string;
  localScanId: string;
  stationId?: string;
}

interface Props {
  eventId: string;
  eventName: string;
  stationId?: string;
  stationName: string;
}

export function QRScannerClient({ eventId, eventName, stationId, stationName }: Props) {
  const [isOnline, setIsOnline] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [queue, setQueue] = useState<QueuedScan[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const scannerRef = useRef<any>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    setIsOnline(navigator.onLine);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(`offline-queue-${eventId}`);
    if (stored) { try { setQueue(JSON.parse(stored)); } catch {} }
  }, [eventId]);

  const saveQueue = useCallback((q: QueuedScan[]) => {
    localStorage.setItem(`offline-queue-${eventId}`, JSON.stringify(q));
    setQueue(q);
  }, [eventId]);

  const extractToken = (decoded: string): string => {
    const trimmed = decoded.trim();
    try {
      const url = new URL(trimmed);
      const parts = url.pathname.split('/').filter(Boolean);
      return parts[parts.length - 1] || trimmed;
    } catch {
      if (trimmed.includes('/')) {
        const parts = trimmed.split('/').filter(Boolean);
        return parts[parts.length - 1] || trimmed;
      }
      return trimmed;
    }
  };

  const processOnlineScan = async (token: string): Promise<ScanResult> => {
    const res = await fetch('/api/checkin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, stationId }) });
    const data = await res.json();
    if (data.success) return { type: 'success', attendeeName: data.attendeeName, registrationCode: data.registrationCode, checkedInAt: data.checkedInAt, stationName: data.stationName };
    if (data.code === 'ALREADY_CHECKED_IN') return { type: 'duplicate', attendeeName: data.attendeeName, checkedInAt: data.checkedInAt, stationName: data.stationName, message: data.message };
    return { type: 'invalid', message: data.message || 'Invalid QR code' };
  };

  const handleScan = useCallback(async (decoded: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    const token = extractToken(decoded);
    if (!isOnline) {
      const scan: QueuedScan = { token, scannedAt: new Date().toISOString(), localScanId: Math.random().toString(36).slice(2), stationId };
      const newQueue = [...queue, scan];
      saveQueue(newQueue);
      setResult({ type: 'offline', message: `Scan saved. Queue: ${newQueue.length}` });
      toast({ title: 'Scan Saved Offline', description: `Queue: ${newQueue.length} pending` });
    } else {
      try {
        const r = await processOnlineScan(token);
        setResult(r);
        if (r.type === 'success') toast({ title: 'Check-In Verified', description: r.attendeeName });
        else if (r.type === 'duplicate') toast({ title: 'Already Checked In', description: r.attendeeName, variant: 'destructive' });
      } catch {
        const scan: QueuedScan = { token, scannedAt: new Date().toISOString(), localScanId: Math.random().toString(36).slice(2), stationId };
        const nq = [...queue, scan]; saveQueue(nq);
        setResult({ type: 'offline', message: 'Network error. Scan saved offline.' });
      }
    }
    setTimeout(() => { setResult(null); processingRef.current = false; }, 4000);
  }, [isOnline, queue, saveQueue, stationId]);

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim() || manualLoading) return;
    setManualLoading(true);
    await handleScan(manualCode.trim());
    setManualCode('');
    setManualLoading(false);
  };

  const syncOfflineQueue = async () => {
    if (queue.length === 0 || !isOnline) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/checkin/offline-sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(queue) });
      const data = await res.json();
      if (data.success) { saveQueue([]); toast({ title: `Synced ${data.synced} scans`, description: data.conflicts > 0 ? `${data.conflicts} conflicts` : 'All synchronized' }); }
    } catch { toast({ title: 'Sync Failed', variant: 'destructive' }); }
    finally { setSyncing(false); }
  };

  useEffect(() => { if (isOnline && queue.length > 0) syncOfflineQueue(); }, [isOnline]);

  const startScanner = async () => {
    setScanning(true); setScannerReady(false);
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-scanner-container', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      });
      scannerRef.current = scanner;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const boxSize = Math.max(180, Math.floor(minEdge * 0.75));
          return { width: boxSize, height: boxSize };
        },
        aspectRatio: 1.0,
      };

      await scanner.start(
        { facingMode: 'environment' },
        config,
        (decoded) => handleScan(decoded),
        () => {}
      );
      setScannerReady(true);
    } catch (err: any) {
      console.error('[Scanner error]', err);
      toast({ title: 'Camera Error', description: 'Could not access camera. Check permissions.', variant: 'destructive' });
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) { try { await scannerRef.current.stop(); } catch {} scannerRef.current = null; }
    setScanning(false); setScannerReady(false); setResult(null);
  };

  useEffect(() => { return () => { if (scannerRef.current) { try { scannerRef.current.stop(); } catch {} } }; }, []);

  return (
    <div className="space-y-4">
      <div>
        <div className="tech-label mb-1">QR Scanner</div>
        <h1 className="text-2xl font-black text-white">{eventName}</h1>
        <p className="text-gray-400 text-sm">{stationName}</p>
      </div>

      <div className={`flex items-center justify-between glass rounded-xl border p-3 ${ isOnline ? 'border-green-500/20' : 'border-red-500/20' }`}>
        <div className="flex items-center gap-2">
          {isOnline ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
          <span className={`text-sm font-mono font-semibold ${ isOnline ? 'text-green-400' : 'text-red-400' }`}>● {isOnline ? 'ONLINE' : 'OFFLINE MODE'}</span>
        </div>
        {queue.length > 0 && (
          <button onClick={syncOfflineQueue} disabled={!isOnline || syncing}
            className="flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-1.5 disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> Sync {queue.length}
          </button>
        )}
      </div>

      {!isOnline && queue.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-400">
          <strong>{queue.length} scan{queue.length !== 1 ? 's' : ''}</strong> queued offline. Will sync automatically when connection returns.
        </div>
      )}

      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="relative bg-black" style={{ minHeight: 360 }}>
          <div id="qr-scanner-container" className="w-full" />
          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-[#080d14]">
              <div className="relative">
                <div className="w-48 h-48 border-2 border-cyan-500/30 rounded-2xl flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-cyan-500/30" />
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400" />
                </div>
              </div>
              <button onClick={startScanner} className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-3 rounded-xl transition-colors shadow-lg shadow-cyan-500/30">
                <Camera className="w-5 h-5" /> Start Scanner
              </button>
            </div>
          )}
          {scanning && scannerReady && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="scan-line" />
            </div>
          )}
        </div>
        {scanning && (
          <div className="p-4 flex items-center justify-between border-t border-white/5">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Scanning...
            </div>
            <button onClick={stopScanner} className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 rounded-lg px-3 py-1.5 transition-colors">Stop</button>
          </div>
        )}
      </div>

      {/* Manual Check-in Option */}
      <div className="glass rounded-2xl border border-white/8 p-4">
        <form onSubmit={handleManualCheckIn} className="space-y-2">
          <label className="text-xs text-gray-400 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" /> Or enter Token / Registration Code manually
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="e.g. 32-char token or CODE-123"
              className="flex-1 bg-black/40 border border-white/10 focus:border-cyan-500/50 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!manualCode.trim() || manualLoading}
              className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 disabled:opacity-40 font-semibold px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-1"
            >
              {manualLoading ? 'Checking...' : <>Verify <ArrowRight className="w-3.5 h-3.5" /></>}
            </button>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }}
            className={`rounded-2xl border p-6 ${ result.type === 'success' ? 'bg-green-500/10 border-green-500/30 success-glow' : result.type === 'duplicate' ? 'bg-red-500/10 border-red-500/30 error-glow' : result.type === 'offline' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30' }`}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {result.type === 'success' && <CheckCircle className="w-10 h-10 text-green-400" />}
                {(result.type === 'duplicate' || result.type === 'invalid') && <XCircle className="w-10 h-10 text-red-400" />}
                {result.type === 'offline' && <WifiOff className="w-10 h-10 text-yellow-400" />}
              </div>
              <div className="flex-1">
                <div className={`font-black text-lg font-mono ${ result.type === 'success' ? 'text-green-400' : result.type === 'duplicate' ? 'text-red-400' : result.type === 'offline' ? 'text-yellow-400' : 'text-red-400' }`}>
                  {result.type === 'success' && 'CHECK-IN VERIFIED'}
                  {result.type === 'duplicate' && 'ALREADY CHECKED IN'}
                  {result.type === 'offline' && 'SAVED OFFLINE'}
                  {result.type === 'invalid' && 'INVALID QR CODE'}
                </div>
                {result.attendeeName && <div className="text-white font-semibold mt-1">{result.attendeeName}</div>}
                {result.type === 'duplicate' && result.checkedInAt && <div className="text-red-300/70 text-sm mt-1">Checked in at {formatTime(result.checkedInAt)}{result.stationName && ` · ${result.stationName}`}</div>}
                {result.message && result.type !== 'duplicate' && <div className="text-gray-400 text-sm mt-1">{result.message}</div>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
