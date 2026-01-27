'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { triggerHaptic } from '@/lib/haptics';
import { getEvolutionProgress } from '@/lib/evolution';
import AuraliaSprite from './AuraliaSprite';
import { PetSprite } from './PetSprite';
import { ProgressRing } from './ProgressRing';
import { RadialWellnessMenu, type WellnessMenuItem } from './RadialWellnessMenu';

interface PetHeroProps {
  className?: string;
  onWellnessSelect?: (item: WellnessMenuItem) => void;
}

const LONG_PRESS_DURATION = 500; // ms to trigger radial menu

/**
 * Pet Hero Section - The main focal point of the app
 * Supports gesture controls, long-press radial wellness menu, and shows the pet prominently
 */
export function PetHero({ className = '', onWellnessSelect }: PetHeroProps) {
  const petType = useStore(state => state.petType);
  const feed = useStore(state => state.feed);
  const play = useStore(state => state.play);
  const clean = useStore(state => state.clean);
  const sleep = useStore(state => state.sleep);
  const vitals = useStore(state => state.vitals);
  const evolution = useStore(state => state.evolution);
  const systemState = useStore(state => state.systemState);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [gestureIndicator, setGestureIndicator] = useState<string | null>(null);
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Radial menu state
  const [isRadialMenuOpen, setIsRadialMenuOpen] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);

  // Calculate overall progress for the ring
  const overallProgress = useMemo(() => {
    const avgVitals = (vitals.hunger + vitals.hygiene + vitals.mood + vitals.energy) / 4;
    return avgVitals;
  }, [vitals]);

  // Evolution progress for secondary ring
  const evolutionProgress = useMemo(() => {
    if (!evolution) return 0;
    // Use the evolution progress helper with vitals average
    const avgVitals = (vitals.hunger + vitals.hygiene + vitals.mood + vitals.energy) / 4;
    return getEvolutionProgress(evolution, avgVitals) * 100;
  }, [evolution, vitals]);

  // Show gesture feedback
  const showGesture = useCallback((gesture: string) => {
    setGestureIndicator(gesture);
    setTimeout(() => setGestureIndicator(null), 800);
  }, []);

  // Clear long press timer
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsLongPressing(false);
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRadialMenuOpen || systemState === 'sealed') return;

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    // Start long press detection
    setIsLongPressing(true);
    longPressTimerRef.current = setTimeout(() => {
      // Long press detected - open radial menu
      triggerHaptic('heavy');
      setIsRadialMenuOpen(true);
      setIsLongPressing(false);
      touchStartRef.current = null; // Prevent other gestures
    }, LONG_PRESS_DURATION);
  }, [isRadialMenuOpen, systemState]);

  // Handle touch move - cancel long press if moving
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || isRadialMenuOpen) return;

    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);

    // Cancel long press if finger moves too much
    if (dx > 10 || dy > 10) {
      clearLongPressTimer();
    }
  }, [isRadialMenuOpen, clearLongPressTimer]);

  // Handle touch end - detect gestures
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    clearLongPressTimer();

    // If radial menu is open, don't process other gestures
    if (isRadialMenuOpen || !touchStartRef.current) return;
    if (systemState === 'sealed') return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const duration = Date.now() - touchStartRef.current.time;

    const minSwipeDistance = 50;
    const maxTapDuration = 300;

    // Check for swipe
    if (Math.abs(dx) > minSwipeDistance || Math.abs(dy) > minSwipeDistance) {
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe - Play
        triggerHaptic('medium');
        play();
        showGesture('Play!');
      } else if (dy < -minSwipeDistance) {
        // Swipe up - Clean
        triggerHaptic('medium');
        clean();
        showGesture('Clean!');
      } else if (dy > minSwipeDistance) {
        // Swipe down - Feed
        triggerHaptic('medium');
        feed();
        showGesture('Feed!');
      }
    } else if (duration < maxTapDuration) {
      // It's a tap - track for double tap
      setTapCount(prev => {
        const newCount = prev + 1;

        if (tapTimeoutRef.current) {
          clearTimeout(tapTimeoutRef.current);
        }

        if (newCount === 2) {
          // Double tap - Sleep/Rest
          triggerHaptic('heavy');
          sleep();
          showGesture('Rest...');
          return 0;
        }

        // Wait for potential second tap
        tapTimeoutRef.current = setTimeout(() => {
          if (newCount === 1) {
            // Single tap - Pet/Love
            triggerHaptic('light');
            showGesture('Love!');
          }
          setTapCount(0);
        }, 300);

        return newCount;
      });
    }

    touchStartRef.current = null;
  }, [clean, feed, play, showGesture, sleep, systemState, isRadialMenuOpen, clearLongPressTimer]);

  // Handle radial menu selection
  const handleWellnessSelect = useCallback((item: WellnessMenuItem) => {
    setIsRadialMenuOpen(false);
    onWellnessSelect?.(item);
  }, [onWellnessSelect]);

  // Handle radial menu close
  const handleRadialClose = useCallback(() => {
    setIsRadialMenuOpen(false);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full flex flex-col items-center justify-center ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress Ring Container */}
      <div className="relative">
        {/* Outer Progress Ring - Overall Vitals */}
        <ProgressRing
          progress={overallProgress}
          size={280}
          strokeWidth={4}
          color="cyan"
          className="absolute inset-0 -m-4"
        />

        {/* Inner Progress Ring - Evolution */}
        <ProgressRing
          progress={evolutionProgress}
          size={260}
          strokeWidth={3}
          color="purple"
          className="absolute inset-0 -m-1"
        />

        {/* Pet Container */}
        <div className={`relative w-64 h-64 flex items-center justify-center transition-transform duration-200 ${isLongPressing ? 'scale-95' : ''}`}>
          {petType === 'geometric' ? (
            <PetSprite />
          ) : (
            <AuraliaSprite size="large" interactive />
          )}

          {/* Long Press Indicator */}
          {isLongPressing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-20 h-20 rounded-full border-2 border-white/30 animate-ping" />
            </div>
          )}

          {/* Gesture Indicator Overlay */}
          {gestureIndicator && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="px-4 py-2 bg-black/70 backdrop-blur-sm rounded-xl border border-white/20 animate-bounce">
                <span className="text-white font-semibold text-lg">{gestureIndicator}</span>
              </div>
            </div>
          )}
        </div>

        {/* Radial Wellness Menu */}
        <RadialWellnessMenu
          isOpen={isRadialMenuOpen}
          onSelect={handleWellnessSelect}
          onClose={handleRadialClose}
        />
      </div>

      {/* Gesture Hint */}
      <div className="mt-4 text-center">
        <p className="text-zinc-400 text-sm">
          {systemState === 'sealed'
            ? 'Stillness holds • gestures are quiet'
            : <>Swipe to care • <span className="text-purple-400">Hold</span> for wellness</>}
        </p>
      </div>
    </div>
  );
}
