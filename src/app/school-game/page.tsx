'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Brain, ClipboardList, Play, Sparkles, Users } from 'lucide-react';
import { useEducationStore, FOCUS_AREA_LABELS } from '@/lib/education';
import type { DnaMode, QuickFireChallenge } from '@/lib/education';
import { EducationQueuePanel } from '@/components/EducationQueuePanel';
import { EduVibeBoard } from '@/components/EduVibeBoard';
import DigitalDNAHub from '@/components/DigitalDNAHub';
import type { LessonContext } from '@/components/DigitalDNAHub';

const PILLAR_DNA_MODES: Record<string, DnaMode[]> = {
  'Pattern Detective': ['spiral', 'mandala'],
  'Team Story Builder': ['particles'],
  'Reflection Checkpoint': ['journey'],
};

const PILLARS = [
  {
    title: 'Pattern Detective',
    description:
      'Students identify visual and audio patterns, then explain their reasoning. This supports math fluency and scientific observation.',
    icon: Brain,
  },
  {
    title: 'Team Story Builder',
    description:
      'Small groups solve prompts together and earn shared progress, encouraging communication and collaboration over competition.',
    icon: Users,
  },
  {
    title: 'Reflection Checkpoint',
    description:
      'Every short round ends with a quick SEL reflection so learners connect strategy, mood, and focus habits.',
    icon: ClipboardList,
  },
];

const DIRECTION_ARROWS = ['\u2191', '\u2192', '\u2193', '\u2190']; // up, right, down, left

// ---------- Quick-Fire Challenge Round ----------

function QuickFireRound({ onComplete }: { onComplete: (xpEarned: number) => void }) {
  const generateQuickFire = useEducationStore((s) => s.generateQuickFire);
  const scoreQuickFire = useEducationStore((s) => s.scoreQuickFire);
  const [challenge, setChallenge] = useState<QuickFireChallenge | null>(null);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<'pending' | 'correct' | 'wrong'>('pending');

  const startChallenge = () => {
    const c = generateQuickFire(1);
    setChallenge(c);
    setUserInput([]);
    setTimeLeft(c.timeLimitMs);
    setResult('pending');
  };

  useEffect(() => {
    if (!challenge || result !== 'pending' || timeLeft <= 0) return;
    const timer = setTimeout(() => {
      setTimeLeft((t) => {
        const next = t - 100;
        if (next <= 0) {
          setResult('wrong');
          onComplete(0);
        }
        return Math.max(0, next);
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [timeLeft, challenge, result, onComplete]);

  const handleTap = (digit: number) => {
    if (!challenge || result !== 'pending') return;
    const next = [...userInput, digit];
    setUserInput(next);
    if (next.length === challenge.pattern.length) {
      const { correct, xpEarned } = scoreQuickFire(challenge, next);
      setResult(correct ? 'correct' : 'wrong');
      onComplete(xpEarned);
    }
  };

  if (!challenge) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={startChallenge}
        className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-400/30 text-sm text-purple-200 hover:border-purple-400/60 transition"
      >
        {'\u26A1'} Quick-Fire Challenge
      </motion.button>
    );
  }

  const showPattern = timeLeft > (challenge.timeLimitMs - 2000);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-lg border border-purple-400/30 bg-purple-500/5 p-3 space-y-2"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-purple-200">Match the pattern!</p>
        <span className={`text-xs font-mono ${timeLeft < 3000 ? 'text-rose-400' : 'text-zinc-400'}`}>
          {(timeLeft / 1000).toFixed(1)}s
        </span>
      </div>
      <div className="flex gap-1 justify-center">
        {challenge.pattern.map((d, i) => (
          <div key={i} className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center text-sm font-mono text-cyan-300">
            {showPattern ? DIRECTION_ARROWS[d] : '?'}
          </div>
        ))}
      </div>
      <div className="flex gap-1 justify-center text-[10px] text-zinc-500">
        {userInput.map((d, i) => (
          <span key={i} className="text-cyan-300">{DIRECTION_ARROWS[d]}</span>
        ))}
      </div>
      <div className="flex gap-2 justify-center">
        {[0, 1, 2, 3].map((d) => (
          <motion.button
            key={d}
            whileTap={{ scale: 0.85 }}
            onClick={() => handleTap(d)}
            disabled={result !== 'pending'}
            className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-lg transition disabled:opacity-40"
          >
            {DIRECTION_ARROWS[d]}
          </motion.button>
        ))}
      </div>
      <AnimatePresence>
        {result !== 'pending' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-center space-y-1"
          >
            <p className={`text-sm font-bold ${result === 'correct' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {result === 'correct' ? '\uD83E\uDDE0 Nailed it!' : '\uD83D\uDE05 Almost!'}
            </p>
            <button
              onClick={startChallenge}
              className="text-[11px] text-purple-300 hover:text-purple-200 underline"
            >
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------- Main Page ----------

export default function SchoolGamePage() {
  const queue = useEducationStore((s) => s.queue);
  const activeLesson = useEducationStore((s) => s.activeLesson);
  const activateLesson = useEducationStore((s) => s.activateLesson);
  const lessonProgress = useEducationStore((s) => s.lessonProgress);

  const [activeDnaView, setActiveDnaView] = useState<LessonContext | null>(null);
  const [studentAlias, setStudentAlias] = useState('');

  const completedCount = useMemo(
    () => lessonProgress.filter((p) => p.status === 'completed').length,
    [lessonProgress],
  );

  const activeLessonData = useMemo(
    () => queue.find((l) => l.id === activeLesson),
    [queue, activeLesson],
  );

  const handleStartQuest = () => {
    const firstLesson = queue[0];
    if (firstLesson) {
      activateLesson(firstLesson.id);
      if (studentAlias.trim() && firstLesson.dnaMode) {
        setActiveDnaView({
          lessonId: firstLesson.id,
          studentAlias: studentAlias.trim(),
          prePrompt: firstLesson.prePrompt,
          postPrompt: firstLesson.postPrompt,
        });
      }
    }
  };

  const handlePillarStart = (pillarTitle: string) => {
    const modes = PILLAR_DNA_MODES[pillarTitle] ?? [];
    const matchingLesson = queue.find(
      (l) => l.dnaMode && modes.includes(l.dnaMode),
    );
    if (matchingLesson && studentAlias.trim()) {
      activateLesson(matchingLesson.id);
      setActiveDnaView({
        lessonId: matchingLesson.id,
        studentAlias: studentAlias.trim(),
        prePrompt: matchingLesson.prePrompt,
        postPrompt: matchingLesson.postPrompt,
      });
    }
  };

  // If DNA Hub is active, show it
  if (activeDnaView) {
    return (
      <div>
        <div className="fixed top-4 left-4 z-50">
          <button
            type="button"
            onClick={() => setActiveDnaView(null)}
            className="px-4 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-sm text-zinc-200 hover:bg-slate-700 transition"
          >
            Back to Quest
          </button>
        </div>
        <DigitalDNAHub lessonContext={activeDnaView} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-white px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
            <Sparkles className="h-3.5 w-3.5" />
            Classroom-ready
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">Classroom Quest</h1>
          <p className="text-slate-300">
            A calm, school-appropriate experience focused on teamwork, pattern literacy, and short reflection loops.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-8">
            {/* Queue Summary */}
            {queue.length > 0 && (
              <section className="rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-cyan-200">Lesson Queue</h2>
                  <p className="text-xs text-cyan-300">
                    {completedCount} of {queue.length} done
                  </p>
                </div>
                {activeLessonData && (
                  <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-3">
                    <p className="text-xs text-cyan-300 uppercase tracking-wide">Active now</p>
                    <p className="text-sm font-semibold text-white mt-1">{activeLessonData.title}</p>
                    <p className="text-xs text-zinc-400">
                      {FOCUS_AREA_LABELS[activeLessonData.focusArea]} · {activeLessonData.targetMinutes} min
                    </p>
                  </div>
                )}

                {/* Student alias input */}
                <div className="flex gap-2">
                  <input
                    value={studentAlias}
                    onChange={(e) => setStudentAlias(e.target.value)}
                    placeholder="Your alias (e.g., Bluebird 4)"
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={handleStartQuest}
                    disabled={!studentAlias.trim() || queue.length === 0}
                    className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <Play className="h-4 w-4 inline mr-1" />
                    Start Quest
                  </button>
                </div>

                <EducationQueuePanel
                  mode="student"
                  onLessonActivate={(lessonId) => {
                    const lesson = queue.find((l) => l.id === lessonId);
                    if (lesson && studentAlias.trim() && lesson.dnaMode) {
                      activateLesson(lessonId);
                      setActiveDnaView({
                        lessonId,
                        studentAlias: studentAlias.trim(),
                        prePrompt: lesson.prePrompt,
                        postPrompt: lesson.postPrompt,
                      });
                    } else {
                      activateLesson(lessonId);
                    }
                  }}
                />
              </section>
            )}

            {/* Learning Pillars */}
            <section className="grid gap-4 sm:grid-cols-3">
              {PILLARS.map(({ title, description, icon: Icon }) => {
                const modes = PILLAR_DNA_MODES[title] ?? [];
                const hasMatchingLesson = queue.some(
                  (l) => l.dnaMode && modes.includes(l.dnaMode),
                );
                return (
                  <article key={title} className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 space-y-3">
                    <Icon className="h-5 w-5 text-cyan-300" />
                    <h2 className="font-semibold">{title}</h2>
                    <p className="text-sm text-slate-300">{description}</p>
                    {hasMatchingLesson && studentAlias.trim() && (
                      <button
                        type="button"
                        onClick={() => handlePillarStart(title)}
                        className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs text-cyan-200 transition"
                      >
                        <Play className="h-3 w-3 inline mr-1" />
                        Start {title}
                      </button>
                    )}
                    {/* Quick-Fire Challenge per pillar */}
                    {studentAlias.trim() && (
                      <QuickFireRound onComplete={() => {}} />
                    )}
                  </article>
                );
              })}
            </section>

            {/* Round flow */}
            <section className="rounded-2xl border border-indigo-300/30 bg-indigo-500/10 p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-indigo-200">
                <BookOpen className="h-5 w-5" />
                Round flow (10 minutes)
              </h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-200">
                <li>Warm-up clue (1 min): identify a sequence pattern.</li>
                <li>Team challenge (6 min): solve three mixed logic prompts.</li>
                <li>Reflection (2 min): students pick which strategy helped most.</li>
                <li>Teacher snapshot (1 min): local-only summary of class progress.</li>
              </ol>
            </section>

            {/* No queue fallback */}
            {queue.length === 0 && (
              <section className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-5">
                <p className="text-sm text-amber-200">
                  No lessons queued yet. Ask your teacher to set up activities in the{' '}
                  <Link href="/" className="underline text-amber-300 hover:text-amber-100">
                    Classroom Manager
                  </Link>
                  , or explore the DNA Hub directly.
                </p>
              </section>
            )}
          </div>

          {/* Sidebar: Vibe Board */}
          <aside className="space-y-4">
            <EduVibeBoard />
          </aside>
        </div>

        <footer className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/pet"
            className="rounded-lg border border-slate-600 px-3 py-2 text-slate-200 hover:bg-slate-800"
          >
            Back to Pet
          </Link>
          <Link
            href="/digital-dna"
            className="rounded-lg border border-cyan-400/50 px-3 py-2 text-cyan-200 hover:bg-cyan-500/10"
          >
            Open Digital DNA Hub
          </Link>
        </footer>
      </div>
    </main>
  );
}
