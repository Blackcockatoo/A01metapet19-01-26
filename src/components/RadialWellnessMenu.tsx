'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWellnessStore, getTodayHydration, getTodaySleepHours } from '@/lib/wellness';
import { triggerHaptic } from '@/lib/haptics';
import { Heart, Droplets, Moon, Anchor, Settings } from 'lucide-react';

export type WellnessMenuItem = 'mood' | 'water' | 'sleep' | 'calm' | 'settings';

interface RadialWellnessMenuProps {
  isOpen: boolean;
  onSelect: (item: WellnessMenuItem) => void;
  onClose: () => void;
}

interface MenuItem {
  id: WellnessMenuItem;
  icon: React.ReactNode;
  label: string;
  color: string;
  glowColor: string;
  angle: number; // degrees from top
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'mood',
    icon: <Heart className="w-6 h-6" />,
    label: 'Mood',
    color: 'text-purple-400',
    glowColor: 'shadow-purple-500/50',
    angle: 270, // top
  },
  {
    id: 'water',
    icon: <Droplets className="w-6 h-6" />,
    label: 'Water',
    color: 'text-cyan-400',
    glowColor: 'shadow-cyan-500/50',
    angle: 180, // left
  },
  {
    id: 'sleep',
    icon: <Moon className="w-6 h-6" />,
    label: 'Sleep',
    color: 'text-violet-400',
    glowColor: 'shadow-violet-500/50',
    angle: 0, // right
  },
  {
    id: 'calm',
    icon: <Anchor className="w-6 h-6" />,
    label: 'Calm',
    color: 'text-indigo-400',
    glowColor: 'shadow-indigo-500/50',
    angle: 90, // bottom
  },
  {
    id: 'settings',
    icon: <Settings className="w-5 h-5" />,
    label: '',
    color: 'text-zinc-400',
    glowColor: 'shadow-zinc-500/30',
    angle: 45, // bottom-right corner
  },
];

const RADIUS = 90; // pixels from center to menu items
const ITEM_SIZE = 56; // touch target size

export function RadialWellnessMenu({ isOpen, onSelect, onClose }: RadialWellnessMenuProps) {
  const [hoveredItem, setHoveredItem] = useState<WellnessMenuItem | null>(null);
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get wellness data for progress rings
  const hydration = useWellnessStore(state => state.hydration);
  const sleep = useWellnessStore(state => state.sleep);

  const waterProgress = getTodayHydration(hydration) / hydration.dailyGoal;
  const sleepProgress = getTodaySleepHours(sleep) / sleep.dailyGoal;

  // Calculate item position based on angle
  const getItemPosition = (angle: number) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x: Math.cos(radians) * RADIUS,
      y: Math.sin(radians) * RADIUS,
    };
  };

  // Detect which item is under touch point
  const getItemAtPosition = useCallback((clientX: number, clientY: number): WellnessMenuItem | null => {
    if (!containerRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If too close to center or too far, no selection
    if (distance < 40 || distance > RADIUS + ITEM_SIZE) return null;

    // Find closest item
    let closestItem: WellnessMenuItem | null = null;
    let closestDistance = Infinity;

    for (const item of MENU_ITEMS) {
      const pos = getItemPosition(item.angle);
      const itemDx = dx - pos.x;
      const itemDy = dy - pos.y;
      const itemDistance = Math.sqrt(itemDx * itemDx + itemDy * itemDy);

      if (itemDistance < closestDistance && itemDistance < ITEM_SIZE) {
        closestDistance = itemDistance;
        closestItem = item.id;
      }
    }

    return closestItem;
  }, []);

  // Handle touch/mouse move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isOpen) return;

    const item = getItemAtPosition(e.clientX, e.clientY);
    if (item !== hoveredItem) {
      setHoveredItem(item);
      if (item) triggerHaptic('light');
    }
    setTouchPosition({ x: e.clientX, y: e.clientY });
  }, [isOpen, hoveredItem, getItemAtPosition]);

  // Handle selection on pointer up
  const handlePointerUp = useCallback(() => {
    if (hoveredItem) {
      triggerHaptic('medium');
      onSelect(hoveredItem);
    } else {
      onClose();
    }
    setHoveredItem(null);
    setTouchPosition(null);
  }, [hoveredItem, onSelect, onClose]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-50 flex items-center justify-center"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Backdrop blur */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Center glow */}
      <div className="absolute w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 blur-xl animate-pulse" />

      {/* Menu items */}
      {MENU_ITEMS.map((item, index) => {
        const pos = getItemPosition(item.angle);
        const isHovered = hoveredItem === item.id;
        const isSettings = item.id === 'settings';

        // Progress ring data
        let progress = 0;
        if (item.id === 'water') progress = Math.min(waterProgress, 1);
        if (item.id === 'sleep') progress = Math.min(sleepProgress, 1);

        return (
          <div
            key={item.id}
            className="absolute transition-all duration-300"
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${isHovered ? 1.15 : 1})`,
              animationDelay: `${index * 50}ms`,
            }}
          >
            {/* Glass button */}
            <div
              className={`
                relative flex flex-col items-center justify-center
                rounded-full transition-all duration-200
                ${isSettings ? 'w-12 h-12' : 'w-14 h-14'}
                ${isHovered
                  ? `bg-white/20 shadow-lg ${item.glowColor} shadow-xl scale-110`
                  : 'bg-white/10 shadow-md'
                }
                backdrop-blur-xl border border-white/20
                animate-in zoom-in-50 fade-in duration-300
              `}
              style={{
                boxShadow: isHovered
                  ? `0 0 30px 5px var(--tw-shadow-color), 0 8px 32px rgba(0,0,0,0.3)`
                  : '0 4px 16px rgba(0,0,0,0.2)',
              }}
            >
              {/* Progress ring (for water and sleep) */}
              {progress > 0 && !isSettings && (
                <svg
                  className="absolute inset-0 -rotate-90"
                  viewBox="0 0 56 56"
                >
                  <circle
                    cx="28"
                    cy="28"
                    r="26"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-white/10"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="26"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={`${progress * 163.36} 163.36`}
                    className={item.color}
                  />
                </svg>
              )}

              {/* Icon */}
              <span className={`${item.color} ${isHovered ? 'drop-shadow-lg' : ''}`}>
                {item.icon}
              </span>
            </div>

            {/* Label */}
            {item.label && (
              <span
                className={`
                  absolute -bottom-6 left-1/2 -translate-x-1/2
                  text-xs font-medium whitespace-nowrap
                  transition-all duration-200
                  ${isHovered ? 'text-white' : 'text-white/70'}
                `}
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}

      {/* Center indicator - shows what will be selected */}
      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center
          bg-white/5 backdrop-blur-sm border border-white/10
          transition-all duration-200
          ${hoveredItem ? 'scale-90 opacity-50' : 'scale-100 opacity-100'}
        `}>
          <span className="text-white/50 text-xs text-center">
            {hoveredItem ? '' : 'Drag to select'}
          </span>
        </div>
      </div>

      {/* Hint at bottom */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <span className="text-white/40 text-xs">
          Release to {hoveredItem ? `open ${hoveredItem}` : 'close'}
        </span>
      </div>
    </div>
  );
}
