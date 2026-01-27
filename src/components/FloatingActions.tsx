'use client';

import { useState, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { triggerHaptic } from '@/lib/haptics';
import { UtensilsCrossed, Droplets, Sparkles, Moon } from 'lucide-react';

/**
 * Floating action buttons near the pet for quick interactions
 * Touch-optimized with haptic feedback
 */
export function FloatingActions() {
  const feed = useStore(state => state.feed);
  const clean = useStore(state => state.clean);
  const play = useStore(state => state.play);
  const sleep = useStore(state => state.sleep);
  const systemState = useStore(state => state.systemState);

  const [activeAction, setActiveAction] = useState<string | null>(null);

  const handleAction = useCallback((action: () => void, name: string) => {
    setActiveAction(name);
    triggerHaptic('medium');
    action();

    // Visual feedback duration
    setTimeout(() => setActiveAction(null), 300);
  }, []);

  const actions = [
    {
      name: 'feed',
      icon: UtensilsCrossed,
      action: feed,
      color: 'from-orange-500 to-red-500',
      activeColor: 'ring-orange-400',
      label: 'Feed',
    },
    {
      name: 'clean',
      icon: Droplets,
      action: clean,
      color: 'from-blue-500 to-cyan-500',
      activeColor: 'ring-blue-400',
      label: 'Clean',
    },
    {
      name: 'play',
      icon: Sparkles,
      action: play,
      color: 'from-pink-500 to-purple-500',
      activeColor: 'ring-pink-400',
      label: 'Play',
    },
    {
      name: 'sleep',
      icon: Moon,
      action: sleep,
      color: 'from-indigo-500 to-violet-500',
      activeColor: 'ring-indigo-400',
      label: 'Rest',
    },
  ];

  const isSealed = systemState === 'sealed';

  return (
    <div className="flex items-center justify-center gap-3 py-4 px-4">
      {actions.map(({ name, icon: Icon, action, color, activeColor, label }) => (
        <button
          key={name}
          type="button"
          onClick={() => handleAction(action, name)}
          disabled={isSealed}
          className={`
            relative flex flex-col items-center gap-1
            min-w-[64px] min-h-[64px] p-3
            rounded-2xl
            bg-gradient-to-br ${color}
            shadow-lg shadow-black/30
            active:scale-95 transition-all duration-150
            touch-manipulation
            ${activeAction === name ? `ring-2 ${activeColor} ring-offset-2 ring-offset-slate-950` : ''}
            ${isSealed ? 'opacity-40 grayscale cursor-not-allowed active:scale-100' : ''}
          `}
          aria-label={label}
        >
          <Icon className="w-6 h-6 text-white" />
          <span className="text-[10px] font-medium text-white/90">{label}</span>

          {/* Ripple effect on tap */}
          {activeAction === name && (
            <span className="absolute inset-0 rounded-2xl bg-white/20 animate-ping" />
          )}
        </button>
      ))}
    </div>
  );
}
