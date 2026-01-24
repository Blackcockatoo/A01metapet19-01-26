'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { HUD } from '@/components/HUD';
import AuraliaMetaPet from '@/components/AuraliaMetaPet';
import { Button } from '@/components/ui/button';
import { PetResponseOverlay } from '@/components/PetResponseOverlay';
import { AddonInventoryPanel } from '@/components/addons/AddonInventoryPanel';
import { initializeStarterAddons } from '@/lib/addons/starter';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function PetPage() {
  const startTick = useStore(s => s.startTick);
  const stopTick = useStore(s => s.stopTick);
  const [showAddonPanel, setShowAddonPanel] = useState(false);
  const [addonsInitialized, setAddonsInitialized] = useState(false);

  useEffect(() => {
    startTick();
    return () => stopTick();
  }, [startTick, stopTick]);

  // Initialize starter addons on first load
  useEffect(() => {
    if (!addonsInitialized) {
      initializeStarterAddons().then((result) => {
        if (result.success) {
          console.log(`Addon system initialized! Created ${result.addonsCreated} starter addons.`);
          setAddonsInitialized(true);
        }
      });
    }
  }, [addonsInitialized]);

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex flex-col overflow-auto">
      {/* Real-time Response Overlay */}
      <PetResponseOverlay enableAudio={true} enableAnticipation={true} />

      {/* Back button */}
      <div className="absolute top-4 left-4 z-50">
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-slate-700 bg-slate-900/80 text-zinc-300 hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
      </div>

      {/* Addons button */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddonPanel(!showAddonPanel)}
          className="gap-2 border-purple-700 bg-purple-900/80 text-purple-200 hover:bg-purple-800"
        >
          <Sparkles className="w-4 h-4" />
          Addons
        </Button>
      </div>

      {/* Addon Inventory Panel */}
      {showAddonPanel && (
        <div className="absolute top-16 right-4 z-50 max-w-2xl">
          <AddonInventoryPanel />
        </div>
      )}

      {/* Main Pet Window - Full Screen */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full h-full max-w-4xl bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col">
          {/* Pet Display Area */}
          <div className="flex-1 bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 relative">
            <AuraliaMetaPet />
          </div>

          {/* Controls Bar */}
          <div className="p-6 bg-slate-900/90 border-t border-slate-700/50 flex-shrink-0">
            <HUD />
          </div>
        </div>
      </div>
    </div>
  );
}
