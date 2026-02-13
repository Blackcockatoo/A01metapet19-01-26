/**
 * Education Queue Store
 *
 * Zustand store with localStorage persistence for managing
 * lesson queues and student progress tracking.
 *
 * Follows the same pattern as /src/lib/wellness/store.ts
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  EducationQueueState,
  QueuedLesson,
  LessonProgress,
  LessonStatus,
  SessionMode,
  FocusArea,
  DnaMode,
  QueueAnalytics,
  createDefaultQueueState,
} from './types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

interface EducationActions {
  // Queue management (teacher)
  addLesson: (lesson: Omit<QueuedLesson, 'id' | 'position' | 'createdAt'>) => void;
  removeLesson: (lessonId: string) => void;
  reorderQueue: (lessonId: string, direction: 'up' | 'down') => void;
  clearQueue: () => void;
  updateLesson: (lessonId: string, updates: Partial<Pick<QueuedLesson, 'title' | 'description' | 'focusArea' | 'dnaMode' | 'targetMinutes' | 'standardsRef' | 'prePrompt' | 'postPrompt'>>) => void;

  // Session flow
  setSessionMode: (mode: SessionMode) => void;
  startSession: () => void;
  endSession: () => void;
  activateLesson: (lessonId: string) => void;
  pauseLesson: (lessonId: string, studentAlias: string) => void;
  completeLesson: (lessonId: string, studentAlias: string) => void;

  // Student progress
  initProgress: (lessonId: string, studentAlias: string) => void;
  recordPreResponse: (lessonId: string, studentAlias: string, response: string) => void;
  recordPostResponse: (lessonId: string, studentAlias: string, response: string) => void;
  incrementDnaInteraction: (lessonId: string, studentAlias: string) => void;
  recordPatternHash: (lessonId: string, studentAlias: string, hash: string) => void;
  addTimeSpent: (lessonId: string, studentAlias: string, ms: number) => void;

  // Analytics
  getQueueAnalytics: () => QueueAnalytics;

  // Reset
  reset: () => void;
}

type EducationStore = EducationQueueState & EducationActions;

export const useEducationStore = create<EducationStore>()(
  persist(
    (set, get) => ({
      ...createDefaultQueueState(),

      // ---------- Queue management ----------

      addLesson: (lesson) => set((state) => {
        const newLesson: QueuedLesson = {
          ...lesson,
          id: generateId(),
          position: state.queue.length,
          createdAt: Date.now(),
        };
        return { queue: [...state.queue, newLesson] };
      }),

      removeLesson: (lessonId) => set((state) => {
        const filtered = state.queue
          .filter((l) => l.id !== lessonId)
          .map((l, i) => ({ ...l, position: i }));
        return {
          queue: filtered,
          activeLesson: state.activeLesson === lessonId ? null : state.activeLesson,
          lessonProgress: state.lessonProgress.filter((p) => p.lessonId !== lessonId),
        };
      }),

      reorderQueue: (lessonId, direction) => set((state) => {
        const idx = state.queue.findIndex((l) => l.id === lessonId);
        if (idx === -1) return state;
        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= state.queue.length) return state;

        const newQueue = [...state.queue];
        const temp = newQueue[idx];
        newQueue[idx] = newQueue[newIdx];
        newQueue[newIdx] = temp;
        return {
          queue: newQueue.map((l, i) => ({ ...l, position: i })),
        };
      }),

      clearQueue: () => set({
        queue: [],
        activeLesson: null,
        lessonProgress: [],
      }),

      updateLesson: (lessonId, updates) => set((state) => ({
        queue: state.queue.map((l) =>
          l.id === lessonId ? { ...l, ...updates } : l
        ),
      })),

      // ---------- Session flow ----------

      setSessionMode: (mode) => set({ sessionMode: mode }),

      startSession: () => set((state) => ({
        sessionStartedAt: Date.now(),
        sessionEndedAt: null,
        totalSessionsRun: state.totalSessionsRun + 1,
      })),

      endSession: () => set({
        sessionEndedAt: Date.now(),
        activeLesson: null,
      }),

      activateLesson: (lessonId) => set({ activeLesson: lessonId }),

      pauseLesson: (lessonId, studentAlias) => set((state) => ({
        lessonProgress: state.lessonProgress.map((p) =>
          p.lessonId === lessonId && p.studentAlias === studentAlias
            ? { ...p, status: 'paused' as LessonStatus }
            : p
        ),
      })),

      completeLesson: (lessonId, studentAlias) => set((state) => ({
        lessonProgress: state.lessonProgress.map((p) =>
          p.lessonId === lessonId && p.studentAlias === studentAlias
            ? { ...p, status: 'completed' as LessonStatus, completedAt: Date.now() }
            : p
        ),
      })),

      // ---------- Student progress ----------

      initProgress: (lessonId, studentAlias) => set((state) => {
        const exists = state.lessonProgress.some(
          (p) => p.lessonId === lessonId && p.studentAlias === studentAlias
        );
        if (exists) return state;

        const progress: LessonProgress = {
          lessonId,
          studentAlias,
          status: 'queued',
          startedAt: null,
          completedAt: null,
          timeSpentMs: 0,
          preResponse: null,
          postResponse: null,
          dnaInteractions: 0,
          patternHash: null,
        };
        return { lessonProgress: [...state.lessonProgress, progress] };
      }),

      recordPreResponse: (lessonId, studentAlias, response) => set((state) => ({
        lessonProgress: state.lessonProgress.map((p) =>
          p.lessonId === lessonId && p.studentAlias === studentAlias
            ? { ...p, preResponse: response, status: 'active' as LessonStatus, startedAt: p.startedAt ?? Date.now() }
            : p
        ),
      })),

      recordPostResponse: (lessonId, studentAlias, response) => set((state) => ({
        lessonProgress: state.lessonProgress.map((p) =>
          p.lessonId === lessonId && p.studentAlias === studentAlias
            ? { ...p, postResponse: response }
            : p
        ),
      })),

      incrementDnaInteraction: (lessonId, studentAlias) => set((state) => ({
        lessonProgress: state.lessonProgress.map((p) =>
          p.lessonId === lessonId && p.studentAlias === studentAlias
            ? { ...p, dnaInteractions: p.dnaInteractions + 1 }
            : p
        ),
      })),

      recordPatternHash: (lessonId, studentAlias, hash) => set((state) => ({
        lessonProgress: state.lessonProgress.map((p) =>
          p.lessonId === lessonId && p.studentAlias === studentAlias
            ? { ...p, patternHash: hash }
            : p
        ),
      })),

      addTimeSpent: (lessonId, studentAlias, ms) => set((state) => ({
        lessonProgress: state.lessonProgress.map((p) =>
          p.lessonId === lessonId && p.studentAlias === studentAlias
            ? { ...p, timeSpentMs: p.timeSpentMs + ms }
            : p
        ),
      })),

      // ---------- Analytics (aggregated, no aliases) ----------

      getQueueAnalytics: () => {
        const state = get();
        const completed = state.lessonProgress.filter((p) => p.status === 'completed');
        const active = state.lessonProgress.filter((p) => p.status === 'active');
        const totalTime = completed.reduce((sum, p) => sum + p.timeSpentMs, 0);
        const uniqueStudents = new Set(state.lessonProgress.map((p) => p.studentAlias));

        return {
          totalLessons: state.queue.length,
          completedLessons: completed.length,
          activeLessons: active.length,
          completionRate: state.lessonProgress.length === 0
            ? 0
            : completed.length / state.lessonProgress.length,
          totalStudentsTracked: uniqueStudents.size,
          averageTimePerLessonMs: completed.length === 0 ? 0 : totalTime / completed.length,
          totalDnaInteractions: state.lessonProgress.reduce((sum, p) => sum + p.dnaInteractions, 0),
          updatedAt: Date.now(),
        };
      },

      // ---------- Reset ----------

      reset: () => set(createDefaultQueueState()),
    }),
    {
      name: 'metapet-education-queue',
    }
  )
);
