'use client';

import { useMemo } from 'react';
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
import type { QueuedLesson } from '@/lib/education';
import { FOCUS_AREA_LABELS, DNA_MODE_LABELS } from '@/lib/education';

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

  if (mode === 'teacher') {
    return <TeacherQueue
      queue={queue}
      activeLesson={activeLesson}
      completedLessonIds={completedLessonIds}
      lessonProgress={lessonProgress}
      onRemove={removeLesson}
      onReorder={reorderQueue}
      onActivate={handleActivate}
    />;
  }

  return <StudentQueue
    queue={queue}
    activeLesson={activeLesson}
    completedLessonIds={completedLessonIds}
    onActivate={handleActivate}
  />;
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
            <div
              key={lesson.id}
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
            </div>
          );
        })}
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
}: {
  queue: QueuedLesson[];
  activeLesson: string | null;
  completedLessonIds: Set<string>;
  onActivate: (id: string) => void;
}) {
  // Find the first incomplete lesson
  const nextLessonIdx = queue.findIndex(
    (l) => !completedLessonIds.has(l.id) && l.id !== activeLesson
  );

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-zinc-200">Your Learning Path</p>
      <div className="space-y-1">
        {queue.map((lesson, idx) => {
          const isActive = lesson.id === activeLesson;
          const isCompleted = completedLessonIds.has(lesson.id);
          const isNext = idx === nextLessonIdx && !isActive;
          const isLocked = !isCompleted && !isActive && !isNext;

          return (
            <div
              key={lesson.id}
              className={`flex items-center gap-3 rounded-lg p-3 transition ${
                isActive
                  ? 'border border-cyan-400/60 bg-cyan-500/10'
                  : isCompleted
                  ? 'bg-emerald-500/5'
                  : isNext
                  ? 'border border-slate-700 bg-slate-950/50'
                  : 'opacity-50'
              }`}
            >
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
          );
        })}
      </div>
    </div>
  );
}
