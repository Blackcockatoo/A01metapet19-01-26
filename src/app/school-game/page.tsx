import Link from 'next/link';
import { BookOpen, Brain, ClipboardList, Sparkles, Users } from 'lucide-react';

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

export default function SchoolGamePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-white px-6 py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
            <Sparkles className="h-3.5 w-3.5" />
            Classroom-ready direction
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">School Game Concept: Classroom Quest</h1>
          <p className="text-slate-300">
            Replacing Space Jewbles with a calmer, school-appropriate game focused on teamwork, pattern literacy, and short reflection loops.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          {PILLARS.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
              <Icon className="mb-3 h-5 w-5 text-cyan-300" />
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-slate-300">{description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-indigo-300/30 bg-indigo-500/10 p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-indigo-200">
            <BookOpen className="h-5 w-5" />
            Brainstormed round flow (10 minutes)
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-200">
            <li>Warm-up clue (1 min): identify a sequence pattern.</li>
            <li>Team challenge (6 min): solve three mixed logic prompts.</li>
            <li>Reflection (2 min): students pick which strategy helped most.</li>
            <li>Teacher snapshot (1 min): local-only summary of class progress.</li>
          </ol>
        </section>

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
