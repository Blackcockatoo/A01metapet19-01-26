'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  Circle,
  Lock,
} from 'lucide-react';
import { useEducationStore } from '@/lib/education';
import type { QueuedLesson, VibeReaction } from '@/lib/education';
import { FOCUS_AREA_LABELS, DNA_MODE_LABELS, VIBE_EMOJI } from '@/lib/education';
import { useVisualEffects, VisualEffectsRenderer } from '@/components/VisualEffects';
import { ProgressRing } from '@/components/ProgressRing';

interface EducationQueuePanelProps {
  mode: 'teacher' | 'student';
  onLessonActivate?: (lessonId: string) => void;
}

export function EducationQueuePanel({ mode, onLessonActivate }: EducationQueuePanelProps) {
  const queue = useEducationStore((s) => s.queue);
  const activeLesson = useEducationStore((s) => s.activeLesson);
  const lessonProgress = useEducationStore((s) => s.lessonProgress);
  const removeLesson = useEducationStore((s) => s.removeLesson);
  const reorderQueue = useEducationStore((s) => s.reorderQueue);
  const activateLesson = useEducationStore((s) => s.activateLesson);
  const eduXP = useEducationStore((s) => s.eduXP);
  const classEnergy = useEducationStore((s) => s.classEnergy);
  const sendVibeReaction = useEducationStore((s) => s.sendVibeReaction);
  const { effects, triggerEffect } = useVisualEffects();

  const completedLessonIds = useMemo(() => {
    const completed = new Set<string>();
    for (const p of lessonProgress) {
      if (p.status === 'completed') {
        completed.add(p.lessonId);
      }
    }
    return completed;
  }, [lessonProgress]);

  const handleActivate = (lessonId: string) => {
    activateLesson(lessonId);
    onLessonActivate?.(lessonId);
  };

  if (queue.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
        <p className="text-xs text-zinc-500">
          {mode === 'teacher'
            ? 'No lessons in the queue yet. Create assignments and add them to the queue.'
            : 'No lessons are queued right now. Ask your teacher to set up a lesson path.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* XP & Streak Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ProgressRing progress={eduXP.xp % 100} size={32} strokeWidth={3} color="amber" />
          <div>
            <p className="text-xs font-bold text-amber-300">Lv {eduXP.level}</p>
            <p className="text-[10px] text-zinc-500">{eduXP.xp % 100}/100 XP</p>
          </div>
        </div>
        {eduXP.streak > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 border border-orange-400/30"
          >
            <span className="text-sm">{'\uD83D\uDD25'}</span>
            <span className="text-xs font-bold text-orange-300">{eduXP.streak} streak</span>
          </motion.div>
        )}
      </div>

      {/* Class Energy Meter */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Class Energy</p>
          <p className="text-[10px] text-cyan-300">{Math.round(classEnergy.level)}%</p>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
            animate={{
              width: `${classEnergy.level}%`,
              opacity: classEnergy.level > 60 ? [0.8, 1, 0.8] : 1,
            }}
            transition={{
              width: { duration: 0.5 },
              opacity: { duration: 1.5, repeat: Infinity },
            }}
          />
        </div>
      </div>

      {mode === 'teacher' ? (
        <TeacherQueue
          queue={queue}
          activeLesson={activeLesson}
          completedLessonIds={completedLessonIds}
          lessonProgress={lessonProgress}
          onRemove={removeLesson}
          onReorder={reorderQueue}
          onActivate={handleActivate}
        />
      ) : (
        <StudentQueue
          queue={queue}
          activeLesson={activeLesson}
          completedLessonIds={completedLessonIds}
          onActivate={handleActivate}
          onVibeReaction={sendVibeReaction}
          triggerEffect={triggerEffect}
        />
      )}
      <VisualEffectsRenderer effects={effects} />
    </div>
  );
}

// ---------- Teacher View ----------

function TeacherQueue({
  queue,
  activeLesson,
  completedLessonIds,
  lessonProgress,
  onRemove,
  onReorder,
  onActivate,
}: {
  queue: QueuedLesson[];
  activeLesson: string | null;
  completedLessonIds: Set<string>;
  lessonProgress: { lessonId: string; status: string }[];
  onRemove: (id: string) => void;
  onReorder: (id: string, dir: 'up' | 'down') => void;
  onActivate: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-200">Lesson Queue</p>
        <p className="text-xs text-zinc-500">
          {completedLessonIds.size} of {queue.length} completed
        </p>
      </div>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {queue.map((lesson, idx) => {
            const isActive = lesson.id === activeLesson;
            const isCompleted = completedLessonIds.has(lesson.id);
            const progressCount = lessonProgress.filter(
              (p) => p.lessonId === lesson.id && p.status === 'completed'
            ).length;
            const totalCount = lessonProgress.filter(
              (p) => p.lessonId === lesson.id
            ).length;

            return (
              <motion.div
                key={lesson.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`rounded-lg border p-3 transition ${
                  isActive
                    ? 'border-cyan-400/60 bg-cyan-500/10'
                    : isCompleted
                    ? 'border-emerald-400/40 bg-emerald-500/5'
                    : 'border-slate-800 bg-slate-950/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 font-mono">{idx + 1}.</span>
                      <p className="text-sm font-semibold text-zinc-100 truncate">{lesson.title}</p>
                      {isActive && (
                        <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-[10px] text-cyan-200 font-semibold">
                          ACTIVE
                        </span>
                      )}
                      {isCompleted && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {FOCUS_AREA_LABELS[lesson.focusArea]} · {lesson.targetMinutes} min
                      {lesson.dnaMode && ` · ${DNA_MODE_LABELS[lesson.dnaMode]}`}
                    </p>
                    {totalCount > 0 && (
                      <p className="text-[11px] text-zinc-500 mt-1">
                        {progressCount}/{totalCount} learners done
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-200"
                      onClick={() => onReorder(lesson.id, 'up')}
                      disabled={idx === 0}
                      aria-label="Move up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-200"
                      onClick={() => onReorder(lesson.id, 'down')}
                      disabled={idx === queue.length - 1}
                      aria-label="Move down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    {!isActive ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-cyan-400 hover:bg-cyan-500/10"
                        onClick={() => onActivate(lesson.id)}
                        aria-label="Activate lesson"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Pause className="h-3.5 w-3.5 text-cyan-300" />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/10"
                      onClick={() => onRemove(lesson.id)}
                      aria-label="Remove lesson"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------- Student View (Journey/Pathway) ----------

function StudentQueue({
  queue,
  activeLesson,
  completedLessonIds,
  onActivate,
  onVibeReaction,
  triggerEffect,
}: {
  queue: QueuedLesson[];
  activeLesson: string | null;
  completedLessonIds: Set<string>;
  onActivate: (id: string) => void;
  onVibeReaction: (lessonId: string, reaction: VibeReaction) => void;
  triggerEffect: (type: 'sparkle' | 'confetti' | 'star' | 'burst', x: number, y: number, duration?: number) => void;
}) {
  const nextLessonIdx = queue.findIndex(
    (l) => !completedLessonIds.has(l.id) && l.id !== activeLesson
  );

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-zinc-200">Your Learning Path</p>
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {queue.map((lesson, idx) => {
            const isActive = lesson.id === activeLesson;
            const isCompleted = completedLessonIds.has(lesson.id);
            const isNext = idx === nextLessonIdx && !isActive;
            const isLocked = !isCompleted && !isActive && !isNext;

            return (
              <motion.div
                key={lesson.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`rounded-lg p-3 transition ${
                  isActive
                    ? 'border border-cyan-400/60 bg-cyan-500/10'
                    : isCompleted
                    ? 'bg-emerald-500/5'
                    : isNext
                    ? 'border border-slate-700 bg-slate-950/50'
                    : 'opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : isActive ? (
                      <Play className="h-5 w-5 text-cyan-300" />
                    ) : isLocked ? (
                      <Lock className="h-5 w-5 text-zinc-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-zinc-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-cyan-100' : isCompleted ? 'text-emerald-200' : 'text-zinc-300'
                    }`}>
                      {lesson.title}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {FOCUS_AREA_LABELS[lesson.focusArea]} · {lesson.targetMinutes} min
                    </p>
                  </div>
                  {(isActive || isNext) && (
                    <Button
                      type="button"
                      size="sm"
                      className={`h-8 px-3 text-xs ${
                        isActive
                          ? 'bg-cyan-500/90 hover:bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-zinc-200'
                      }`}
                      onClick={() => onActivate(lesson.id)}
                    >
                      {isActive ? 'Continue' : 'Start'}
                    </Button>
                  )}
                </div>
                {/* Vibe Check buttons on active lesson */}
                {isActive && (
                  <div className="flex items-center gap-1 mt-2 ml-8">
                    <span className="text-[10px] text-zinc-500 mr-1">Vibe:</span>
                    {(['fire', 'brain', 'sleeping', 'mind-blown'] as VibeReaction[]).map((vibe) => (
                      <motion.button
                        key={vibe}
                        whileTap={{ scale: 1.4 }}
                        whileHover={{ scale: 1.15 }}
                        onClick={(e) => {
                          onVibeReaction(lesson.id, vibe);
                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                          triggerEffect('sparkle', rect.left + rect.width / 2, rect.top, 600);
                        }}
                        className="p-1 rounded-lg hover:bg-slate-800/50 transition text-lg"
                        title={vibe}
                      >
                        {VIBE_EMOJI[vibe]}
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
