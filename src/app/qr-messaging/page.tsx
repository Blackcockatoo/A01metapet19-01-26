'use client';

import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRMessagingPage } from '@/components/QRMessaging';

export default function QRMessagingRoute() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2 text-zinc-400 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
              Back to Meta-Pet
            </Button>
          </Link>

          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>MOSS60 Cryptographic Platform</span>
          </div>
        </div>

        {/* Main Content */}
        <QRMessagingPage />

        {/* Footer */}
        <div className="mt-12 text-center text-zinc-600 text-xs space-y-1">
          <p>MOSS60 Ultimate — Experimental Cryptographic Platform</p>
          <p>Base-60 Encoding • XOR Stream Cipher • Lucas Sequence Evolution</p>
        </div>
      </div>
    </div>
  );
}
