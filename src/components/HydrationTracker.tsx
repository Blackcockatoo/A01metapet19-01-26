'use client';

import { useState, useMemo } from 'react';
import { useWellnessStore, getTodayHydration, getDateKey } from '@/lib/wellness';
import { triggerHaptic } from '@/lib/haptics';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassOverlay } from '@/components/GlassCard';
import { Droplets, Plus, Minus, Flame, X } from 'lucide-react';

interface HydrationTrackerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HydrationTracker({ isOpen, onClose }: HydrationTrackerProps) {
  const hydration = useWellnessStore(state => state.hydration);
  const logWater = useWellnessStore(state => state.logWater);
  const setHydrationGoal = useWellnessStore(state => state.setHydrationGoal);
  const enabledFeatures = useWellnessStore(state => state.enabledFeatures);

  const [quickAdd, setQuickAdd] = useState(1);

  const todayTotal = useMemo(() => getTodayHydration(hydration), [hydration]);
  const progress = Math.min((todayTotal / hydration.dailyGoal) * 100, 100);
  const goalReached = todayTotal >= hydration.dailyGoal;

  // Get last 7 days data for mini chart
  const weekData = useMemo(() => {
    const days: { date: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = getDateKey(Date.now() - i * 86400000);
      const total = hydration.entries
        .filter(e => getDateKey(e.timestamp) === date)
        .reduce((sum, e) => sum + e.amount, 0);
      days.push({ date, total });
    }
    return days;
  }, [hydration.entries]);

  const handleLogWater = () => {
    logWater(quickAdd);
    triggerHaptic('medium');
  };

  if (!enabledFeatures.hydration) return null;

  return (
    <GlassOverlay isOpen={isOpen} onClose={onClose}>
      <GlassCard className="p-6" showClose onClose={onClose}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Hydration</h2>
        </div>

        <div className="space-y-6">
          {/* Main progress ring */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
              {/* Background ring */}
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-zinc-800"
                />
                {/* Progress ring */}
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="url(#hydration-gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 3.52} 352`}
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="hydration-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {todayTotal}
                </span>
                <span className="text-sm text-zinc-300">
                  / {hydration.dailyGoal} glasses
                </span>
              </div>
            </div>

            {/* Goal reached message */}
            {goalReached && (
              <div className="flex items-center gap-2 mt-3 text-green-400 animate-in fade-in">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-medium">Goal reached!</span>
              </div>
            )}
          </div>

          {/* Quick add controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuickAdd(Math.max(1, quickAdd - 1))}
              className="border-white/20 bg-white/5 hover:bg-white/10 h-12 w-12 text-white"
            >
              <Minus className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-2 px-6 py-3 bg-cyan-500/20 rounded-xl min-w-[100px] justify-center border border-cyan-500/30">
              <Droplets className="w-6 h-6 text-cyan-400" />
              <span className="text-2xl font-bold text-white">{quickAdd}</span>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuickAdd(Math.min(5, quickAdd + 1))}
              className="border-white/20 bg-white/5 hover:bg-white/10 h-12 w-12 text-white"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          <Button
            onClick={handleLogWater}
            className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-lg touch-manipulation"
          >
            <Droplets className="w-5 h-5 mr-2" />
            Log {quickAdd} glass{quickAdd > 1 ? 'es' : ''}
          </Button>

          {/* Week overview */}
          <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-300 font-medium">This week</span>
              {hydration.streak > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-orange-400">
                  <Flame className="w-4 h-4" />
                  <span className="font-medium">{hydration.streak} day streak</span>
                </div>
              )}
            </div>

            <div className="flex items-end justify-between gap-2 h-16">
              {weekData.map((day, i) => {
                const height = Math.max(8, (day.total / hydration.dailyGoal) * 100);
                const isToday = i === 6;
                const metGoal = day.total >= hydration.dailyGoal;

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
                    <div
                      className={`w-full rounded-t transition-all ${
                        metGoal
                          ? 'bg-gradient-to-t from-cyan-600 to-cyan-400'
                          : isToday
                          ? 'bg-cyan-500/50'
                          : 'bg-white/20'
                      }`}
                      style={{ height: `${Math.min(height, 100)}%` }}
                    />
                    <span className={`text-xs font-medium ${isToday ? 'text-cyan-400' : 'text-zinc-400'}`}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(day.date).getDay()]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Goal adjuster */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <span className="text-sm text-zinc-300 font-medium">Daily goal</span>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHydrationGoal(Math.max(4, hydration.dailyGoal - 1))}
                className="h-8 w-8 p-0 text-white hover:bg-white/10"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-lg font-bold text-white w-8 text-center">{hydration.dailyGoal}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHydrationGoal(Math.min(16, hydration.dailyGoal + 1))}
                className="h-8 w-8 p-0 text-white hover:bg-white/10"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>
    </GlassOverlay>
  );
}

// Floating quick-add button
export function HydrationQuickButton({ onClick }: { onClick: () => void }) {
  const hydration = useWellnessStore(state => state.hydration);
  const logWater = useWellnessStore(state => state.logWater);
  const enabledFeatures = useWellnessStore(state => state.enabledFeatures);

  const todayTotal = useMemo(() => getTodayHydration(hydration), [hydration]);
  const progress = Math.min((todayTotal / hydration.dailyGoal) * 100, 100);

  if (!enabledFeatures.hydration) return null;

  const handleQuickLog = (e: React.MouseEvent) => {
    e.stopPropagation();
    logWater(1);
    triggerHaptic('medium');
  };

  return (
    <div className="flex items-center gap-2">
      {/* Quick log button */}
      <button
        onClick={handleQuickLog}
        className="flex items-center justify-center w-12 h-12 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-full text-cyan-400 transition-all touch-manipulation active:scale-95"
        title="Log 1 glass"
      >
        <Droplets className="w-5 h-5" />
      </button>

      {/* Progress indicator */}
      <button
        onClick={onClick}
        className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-full text-sm transition-all touch-manipulation"
      >
        <div className="w-16 h-2 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-cyan-400 font-medium">{todayTotal}/{hydration.dailyGoal}</span>
      </button>
    </div>
  );
}
