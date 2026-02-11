'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const DigitalDNAHub = dynamic(() => import('@/components/DigitalDNAHub'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-amber-300 text-2xl animate-pulse">Loading Digital DNA...</div>
    </div>
  ),
});

export default function DigitalDNAPage() {
  return (
    <div className="relative">
      <Link
        href="/"
        className="fixed top-3 left-3 z-50 px-3 py-1.5 rounded-full text-xs font-medium
                   bg-slate-900/80 border border-slate-700 text-zinc-300 hover:text-white
                   hover:border-amber-500/50 transition-colors backdrop-blur-sm"
      >
        &larr; Back to Pet
      </Link>
      <DigitalDNAHub />
    </div>
  );
}
