'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { HUD } from '@/components/HUD';
import AuraliaMetaPet from '@/components/AuraliaMetaPet';
import { Button } from '@/components/ui/button';
import { PetResponseOverlay } from '@/components/PetResponseOverlay';
import { AddonInventoryPanel } from '@/components/addons/AddonInventoryPanel';
import { PetProfilePanel } from '@/components/addons/PetProfilePanel';
import { initializeStarterAddons } from '@/lib/addons/starter';
import { ArrowLeft, Sparkles, Shield, Move, UserCircle } from 'lucide-react';
import Link from 'next/link';

export default function PetPage() {
  const startTick = useStore(s => s.startTick);
  const stopTick = useStore(s => s.stopTick);
  const [showAddonPanel, setShowAddonPanel] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [addonEditMode, setAddonEditMode] = useState(false);
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

      {/* Top right buttons */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <Link href="/identity">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-indigo-700 bg-indigo-900/80 text-indigo-200 hover:bg-indigo-800"
          >
            <UserCircle className="w-4 h-4" />
            Identity
          </Button>
        </Link>
        {/* Edit Mode Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddonEditMode(!addonEditMode)}
          className={`gap-2 ${addonEditMode
            ? 'border-blue-500 bg-blue-600 text-white hover:bg-blue-700'
            : 'border-slate-700 bg-slate-900/80 text-zinc-300 hover:bg-slate-800'}`}
        >
          <Move className="w-4 h-4" />
          {addonEditMode ? 'Editing' : 'Edit'}
        </Button>

        {/* Profile/Coat of Arms button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowProfilePanel(!showProfilePanel)}
          className={`gap-2 ${showProfilePanel
            ? 'border-amber-500 bg-amber-600 text-white hover:bg-amber-700'
            : 'border-amber-700 bg-amber-900/80 text-amber-200 hover:bg-amber-800'}`}
        >
          <Shield className="w-4 h-4" />
          Profile
        </Button>

        {/* Addons button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddonPanel(!showAddonPanel)}
          className={`gap-2 ${showAddonPanel
            ? 'border-purple-500 bg-purple-600 text-white hover:bg-purple-700'
            : 'border-purple-700 bg-purple-900/80 text-purple-200 hover:bg-purple-800'}`}
        >
          <Sparkles className="w-4 h-4" />
          Addons
        </Button>
      </div>

      {/* Profile Panel (Coat of Arms, Keys, etc.) */}
      {showProfilePanel && (
        <div className="absolute top-16 left-4 z-50 w-80">
          <PetProfilePanel
            petId="auralia-main"
            petName="Auralia"
            editMode={addonEditMode}
            onEditModeChange={setAddonEditMode}
          />
        </div>
      )}

      {/* Addon Inventory Panel */}
      {showAddonPanel && (
        <div className="absolute top-16 right-4 z-50 max-w-md">
          <AddonInventoryPanel />
        </div>
      )}

      {/* Edit Mode Indicator */}
      {addonEditMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          <span className="font-bold">Edit Mode Active</span> - Drag addons to reposition, hover for controls
        </div>
      )}

      {/* Main Pet Window - Full Screen */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full h-full max-w-4xl bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col">
          {/* Pet Display Area */}
          <div className="flex-1 bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 relative">
            <AuraliaMetaPet
              addonEditMode={addonEditMode}
              onAddonEditModeChange={setAddonEditMode}
            />
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
