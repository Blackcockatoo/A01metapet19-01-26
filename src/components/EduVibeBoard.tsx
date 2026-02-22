'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEducationStore, VIBE_EMOJI } from '@/lib/education';
import type { VibeReaction } from '@/lib/education';
import { ProgressRing } from '@/components/ProgressRing';

export function EduVibeBoard() {
  const classEnergy = useEducationStore((s) => s.classEnergy);
  const vibeReactions = useEducationStore((s) => s.vibeReactions);
  const eduAchievements = useEducationStore((s) => s.eduAchievements);
  const eduXP = useEducationStore((s) => s.eduXP);

  const recentVibes = useMemo(() => vibeReactions.slice(-10).reverse(), [vibeReactions]);

  const vibeDistribution = useMemo(() => {
    const counts: Record<VibeReaction, number> = { fire: 0, brain: 0, sleeping: 0, 'mind-blown': 0 };
    vibeReactions.forEach((v) => { counts[v.reaction]++; });
    return counts;
  }, [vibeReactions]);

  const recentAchievements = useMemo(
    () => eduAchievements
      .filter((a) => a.unlockedAt !== null)
      .sort((a, b) => (b.unlockedAt ?? 0) - (a.unlockedAt ?? 0))
      .slice(0, 5),
    [eduAchievements]
  );

  const energyColor = classEnergy.level > 60 ? 'pink' : classEnergy.level > 30 ? 'purple' : 'cyan';

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 space-y-4">
      <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
        <span className="text-lg">{'\u2728'}</span> Vibe Board
      </h3>

      {/* Class Energy Ring */}
      <div className="flex items-center gap-4">
        <ProgressRing
          progress={classEnergy.level}
          size={64}
          strokeWidth={5}
          color={energyColor}
          showPercentage
        />
        <div>
          <p className="text-sm font-semibold text-zinc-200">Class Energy</p>
          <p className="text-[11px] text-zinc-500">{classEnergy.contributionCount} contributions</p>
        </div>
      </div>

      {/* Live Vibe Feed */}
      {recentVibes.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Live Vibes</p>
          <div className="flex gap-1 flex-wrap">
            <AnimatePresence>
              {recentVibes.map((v, i) => (
                <motion.span
                  key={`${v.timestamp}-${i}`}
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  className="text-xl"
                >
                  {VIBE_EMOJI[v.reaction]}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
          <div className="flex gap-2 text-[10px] text-zinc-500">
            {(Object.entries(vibeDistribution) as [VibeReaction, number][]).map(([vibe, count]) => (
              count > 0 && (
                <span key={vibe}>{VIBE_EMOJI[vibe]} {count}</span>
              )
            ))}
          </div>
        </div>
      )}

      {/* Streak Showcase (anonymous) */}
      {eduXP.bestStreak > 0 && (
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl"
          >
            {'\uD83D\uDD25'}
          </motion.div>
          <div>
            <p className="text-sm font-bold text-orange-300">Best Streak: {eduXP.bestStreak}</p>
            <p className="text-[10px] text-zinc-500">Current: {eduXP.streak}</p>
          </div>
        </div>
      )}

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Recent Badges</p>
          <div className="flex flex-wrap gap-1">
            {recentAchievements.map((ach) => (
              <motion.span
                key={ach.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 border border-slate-700 text-zinc-300"
                title={ach.description}
              >
                {ach.emoji} {ach.name}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
