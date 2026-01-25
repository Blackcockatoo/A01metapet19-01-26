'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, RotateCcw, Check, Copy } from 'lucide-react';
import {
  useQRMessagingStore,
  decodeMoss60,
  isMoss60Format,
  type EncodingFormat,
} from '@/lib/qr-messaging';

interface QRScannerProps {
  compact?: boolean;
  onScan?: (data: string, decoded: string) => void;
}

export function QRScanner({ compact = false, onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    raw: string;
    decoded: string;
    format: EncodingFormat;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const { addScannedQR } = useQRMessagingStore();

  const stopScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setScanning(false);
  }, []);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      let decoded = code.data;
      let format: EncodingFormat = 'text';

      // Handle MOSS60 format
      if (isMoss60Format(code.data)) {
        try {
          decoded = decodeMoss60(code.data);
          format = 'base60';
        } catch (e) {
          decoded = `Error decoding: ${e instanceof Error ? e.message : 'Unknown error'}`;
        }
      } else if (code.data.startsWith('{') || code.data.startsWith('[')) {
        format = 'json';
      } else if (/^[0-9a-fA-F]+$/.test(code.data)) {
        format = 'hex';
      }

      const scanResult = {
        raw: code.data,
        decoded,
        format,
      };

      setResult(scanResult);

      // Store in history
      addScannedQR({
        raw: code.data,
        decoded,
        format,
        timestamp: Date.now(),
        success: true,
      });

      onScan?.(code.data, decoded);

      // Stop scanning after successful scan
      stopScanning();
    }
  }, [addScannedQR, onScan, stopScanning]);

  const startScanning = useCallback(async () => {
    setError(null);
    setResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setScanning(true);

      // Start scanning frames
      scanIntervalRef.current = setInterval(processFrame, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera access denied';
      setError(message);
      setScanning(false);
    }
  }, [facingMode, processFrame]);

  const toggleCamera = useCallback(() => {
    const wasScanning = scanning;
    stopScanning();
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
    if (wasScanning) {
      // Restart with new camera after a brief delay
      setTimeout(() => {
        void startScanning();
      }, 100);
    }
  }, [scanning, stopScanning, startScanning]);

  const copyResult = useCallback(async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result.decoded);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }, [result]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button
            onClick={scanning ? stopScanning : startScanning}
            size="sm"
            variant={scanning ? 'destructive' : 'default'}
            className="flex-1 gap-1"
          >
            {scanning ? (
              <>
                <CameraOff className="w-4 h-4" />
                Stop
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                Scan QR
              </>
            )}
          </Button>
          {scanning && (
            <Button variant="outline" size="sm" onClick={toggleCamera}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {scanning && (
          <div className="relative rounded-lg overflow-hidden border border-cyan-500/50">
            <video
              ref={videoRef}
              className="w-full max-h-48 object-cover"
              playsInline
              muted
            />
            <div className="absolute inset-0 border-2 border-cyan-400/30 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-cyan-400 rounded-lg" />
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {result && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-zinc-100 font-mono break-all">
                {result.decoded.length > 100
                  ? `${result.decoded.substring(0, 100)}...`
                  : result.decoded}
              </p>
              <Button variant="ghost" size="sm" onClick={copyResult}>
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex gap-3">
        <Button
          onClick={scanning ? stopScanning : startScanning}
          className={`flex-1 gap-2 ${scanning ? 'bg-rose-600 hover:bg-rose-700' : ''}`}
        >
          {scanning ? (
            <>
              <CameraOff className="w-5 h-5" />
              Stop Scanner
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              Start Camera Scanner
            </>
          )}
        </Button>
        {scanning && (
          <Button variant="outline" onClick={toggleCamera} className="gap-2">
            <RotateCcw className="w-5 h-5" />
            Flip Camera
          </Button>
        )}
      </div>

      {/* Video Display */}
      <div
        className={`relative rounded-xl overflow-hidden border-2 transition-all ${
          scanning
            ? 'border-cyan-500/50 bg-black'
            : 'border-slate-700 border-dashed bg-slate-950/40'
        }`}
      >
        <video
          ref={videoRef}
          className={`w-full aspect-video object-cover ${scanning ? '' : 'hidden'}`}
          playsInline
          muted
        />

        {scanning && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Scanning overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-cyan-500/10" />
            {/* Center target */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-cyan-400 rounded-lg">
              <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
              <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
            </div>
            {/* Scanning line animation */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-0.5 bg-cyan-400 animate-pulse" />
          </div>
        )}

        {!scanning && (
          <div className="w-full aspect-video flex items-center justify-center text-zinc-500 text-sm">
            Camera feed will appear here
          </div>
        )}
      </div>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Result Display */}
      {result && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-400" />
            <span className="text-sm font-semibold text-green-200">
              QR Code Detected
            </span>
            <span className="text-xs text-zinc-500 ml-auto">
              Format: {result.format.toUpperCase()}
            </span>
          </div>

          <div className="space-y-2">
            <div className="p-3 bg-slate-950/60 rounded-lg">
              <p className="text-xs text-zinc-500 mb-1">Decoded Data:</p>
              <p className="text-sm text-zinc-100 font-mono break-all">
                {result.decoded}
              </p>
            </div>

            {result.format === 'base60' && result.raw !== result.decoded && (
              <div className="p-3 bg-slate-950/60 rounded-lg">
                <p className="text-xs text-zinc-500 mb-1">Raw (MOSS60):</p>
                <p className="text-xs text-cyan-400 font-mono break-all">
                  {result.raw.length > 100
                    ? `${result.raw.substring(0, 100)}...`
                    : result.raw}
                </p>
              </div>
            )}
          </div>

          <Button onClick={copyResult} variant="outline" className="gap-2">
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Decoded Data
              </>
            )}
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
          <p className="text-sm text-rose-400">{error}</p>
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-4">
        <p className="text-xs text-zinc-500">
          Point your camera at a QR code to scan. MOSS60-encoded QR codes will be
          automatically decoded from Base-60 format.
        </p>
      </div>
    </div>
  );
}
