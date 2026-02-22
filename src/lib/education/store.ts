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
  VibeReaction,
  VibeSnapshot,
  EduAchievementId,
  QuickFireChallenge,
  EDU_ACHIEVEMENTS_CATALOG,
  createDefaultQueueState,
} from './types';
import { generateMeditationPattern, validatePattern } from '@/lib/minigames';

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

  // Memetic education actions
  sendVibeReaction: (lessonId: string, reaction: VibeReaction) => void;
  awardXP: (amount: number) => void;
  boostClassEnergy: (amount: number) => void;
  getClassEnergyWithDecay: () => number;
  completeLessonWithFlair: (lessonId: string, studentAlias: string) => EduAchievementId[];
  checkEduAchievements: (context: {
    lessonId: string;
    timeSpentMs: number;
    targetMinutes: number;
    dnaInteractions: number;
    focusArea: FocusArea;
  }) => EduAchievementId[];
  generateQuickFire: (difficulty?: number) => QuickFireChallenge;
  scoreQuickFire: (challenge: QuickFireChallenge, userPattern: number[]) => { correct: boolean; xpEarned: number };

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

      // ---------- Memetic education ----------

      sendVibeReaction: (lessonId, reaction) => set((state) => {
        const snapshot: VibeSnapshot = { lessonId, reaction, timestamp: Date.now() };
        const newCount = state.vibeReactionCount + 1;
        const energy = Math.min(100, state.classEnergy.level + 3);
        return {
          vibeReactions: [...state.vibeReactions.slice(-49), snapshot],
          vibeReactionCount: newCount,
          classEnergy: { level: energy, lastUpdatedAt: Date.now(), contributionCount: state.classEnergy.contributionCount + 1 },
        };
      }),

      awardXP: (amount) => set((state) => {
        const newXP = state.eduXP.xp + amount;
        return {
          eduXP: {
            ...state.eduXP,
            xp: newXP,
            level: Math.floor(newXP / 100),
          },
        };
      }),

      boostClassEnergy: (amount) => set((state) => ({
        classEnergy: {
          level: Math.min(100, state.classEnergy.level + amount),
          lastUpdatedAt: Date.now(),
          contributionCount: state.classEnergy.contributionCount + 1,
        },
      })),

      getClassEnergyWithDecay: () => {
        const state = get();
        const elapsed = Date.now() - state.classEnergy.lastUpdatedAt;
        const decayMinutes = elapsed / 60000;
        return Math.max(0, state.classEnergy.level - decayMinutes * 0.5);
      },

      completeLessonWithFlair: (lessonId, studentAlias) => {
        const state = get();
        // Complete the lesson first
        get().completeLesson(lessonId, studentAlias);

        // Find lesson and progress data
        const lesson = state.queue.find((l) => l.id === lessonId);
        const progress = state.lessonProgress.find(
          (p) => p.lessonId === lessonId && p.studentAlias === studentAlias
        );
        if (!lesson) return [];

        // Award XP
        get().awardXP(25);

        // Update streak
        const newStreak = state.eduXP.streak + 1;
        const newBestStreak = Math.max(newStreak, state.eduXP.bestStreak);
        set((s) => ({
          eduXP: {
            ...s.eduXP,
            streak: newStreak,
            bestStreak: newBestStreak,
            lastCompletedAt: Date.now(),
          },
        }));

        // Boost class energy
        get().boostClassEnergy(10);

        // Track focus area
        set((s) => ({
          completedFocusAreas: {
            ...s.completedFocusAreas,
            [lesson.focusArea]: (s.completedFocusAreas[lesson.focusArea] || 0) + 1,
          },
        }));

        // Track prompt responses
        if (progress?.preResponse && progress?.postResponse) {
          set((s) => ({ promptResponseCount: s.promptResponseCount + 1 }));
        }

        // Check achievements
        const newAchievements = get().checkEduAchievements({
          lessonId,
          timeSpentMs: progress?.timeSpentMs ?? 0,
          targetMinutes: lesson.targetMinutes,
          dnaInteractions: progress?.dnaInteractions ?? 0,
          focusArea: lesson.focusArea,
        });

        return newAchievements;
      },

      checkEduAchievements: (context) => {
        const state = get();
        const newlyUnlocked: EduAchievementId[] = [];
        const tryUnlock = (id: EduAchievementId) => {
          const ach = state.eduAchievements.find((a) => a.id === id);
          if (ach && !ach.unlockedAt) newlyUnlocked.push(id);
        };

        const completedCount = state.lessonProgress.filter((p) => p.status === 'completed').length;
        if (completedCount >= 1) tryUnlock('first-lesson');
        if (context.timeSpentMs > 0 && context.timeSpentMs < context.targetMinutes * 60000 * 0.5) tryUnlock('speedrunner');
        if (context.dnaInteractions >= 10) tryUnlock('big-brain');
        if (state.eduXP.streak >= 5) tryUnlock('streak-lord');
        if (state.vibeReactionCount >= 20) tryUnlock('vibe-king');
        if (state.classEnergy.level >= 80) tryUnlock('class-catalyst');
        if (state.completedFocusAreas['pattern-recognition'] >= 3) tryUnlock('pattern-master');
        if (state.promptResponseCount >= 5) tryUnlock('reflection-sage');

        if (newlyUnlocked.length > 0) {
          set((s) => ({
            eduAchievements: s.eduAchievements.map((a) =>
              newlyUnlocked.includes(a.id) ? { ...a, unlockedAt: Date.now() } : a
            ),
          }));
        }
        return newlyUnlocked;
      },

      generateQuickFire: (difficulty = 1) => {
        const pattern = generateMeditationPattern(Date.now(), 4 + difficulty);
        return {
          id: generateId(),
          pattern,
          timeLimitMs: Math.max(5000, 15000 - difficulty * 2000),
          xpReward: 10 + difficulty * 5,
        };
      },

      scoreQuickFire: (challenge, userPattern) => {
        const { correct } = validatePattern(challenge.pattern, userPattern);
        const xpEarned = correct ? challenge.xpReward : 0;
        if (xpEarned > 0) {
          get().awardXP(xpEarned);
          get().boostClassEnergy(5);
        }
        return { correct, xpEarned };
      },

      // ---------- Reset ----------

      reset: () => set(createDefaultQueueState()),
    }),
    {
      name: 'metapet-education-queue',
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          const defaults = createDefaultQueueState();
          return { ...defaults, ...state };
        }
        return state;
      },
    }
  )
);
