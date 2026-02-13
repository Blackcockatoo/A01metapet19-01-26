'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function GeometrySoundPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const searchParams = useSearchParams();
  const session = searchParams.get('session');
  const iframeSrc = session
    ? `/geometry-sound.html?session=${encodeURIComponent(session)}`
    : '/geometry-sound.html';

  useEffect(() => {
    const handleResize = () => {
      if (iframeRef.current) {
        iframeRef.current.style.height = `${window.innerHeight}px`;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#0a0a1a]">
      <Link
        href="/"
        className="absolute top-3 left-3 z-50 px-3 py-1.5 rounded-full text-xs font-medium
                   bg-slate-900/80 border border-slate-700 text-zinc-300 hover:text-white
                   hover:border-amber-500/50 transition-colors backdrop-blur-sm"
      >
        &larr; Back to Pet
      </Link>
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        className="w-full border-none"
        style={{ height: '100vh' }}
        title="Sacred Geometry &amp; Sonic Consciousness"
        allow="autoplay"
      />
    </div>
  );
}
