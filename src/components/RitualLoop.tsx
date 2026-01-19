import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type InputType = 'mood' | 'pattern' | 'intention' | 'action';
type RitualType = 'tap' | 'hold' | 'name';

type GeometryState = {
  points: number;
  rotation: number;
  thickness: number;
  symmetry: number;
  intensity: number;
};

type Stage = {
  id: 'seed' | 'resonant' | 'aligned' | 'shadow' | 'myth';
  label: string;
  note: string;
};

type Session = {
  inputType: InputType;
  inputValue: string;
  ritual: RitualType;
  timestamp: number;
};

const INPUT_OPTIONS: Record<InputType, string[]> = {
  mood: ['Calm', 'Curious', 'Stressed', 'Energized', 'Soft'],
  pattern: ['Spiral', 'Lattice', 'Wave', 'Shadow', 'Pulse'],
  intention: ['Focus', 'Calm', 'Courage', 'Joy', 'Clarity'],
  action: ['Sent a message', 'Took a walk', 'Breathed deeply', 'Drank water', 'Rested 5 min'],
};

const RITUALS: Record<RitualType, { label: string; description: string; taps?: number; holdMs?: number }> = {
  tap: { label: 'Tap rhythm', description: 'Tap 5 times to offer cadence', taps: 5 },
  hold: { label: 'Hold & breathe', description: 'Hold for 5 seconds to steady the field', holdMs: 5000 },
  name: { label: 'Name the pattern', description: 'Type one word to anchor it' },
};

const STAGE_FLOW: Stage[] = [
  { id: 'seed', label: 'Seed Sigil', note: 'Input makes offering' },
  { id: 'resonant', label: 'Resonant Bloom', note: '3-day streak / 3 offerings' },
  { id: 'aligned', label: 'Aligned Crest', note: '7-day alignment or 5 repeated intents' },
  { id: 'shadow', label: 'Shadow Mirror', note: '3 shadow calls awaken contrast' },
  { id: 'myth', label: 'Myth Gate', note: 'Evolution reveals a deeper page' },
];

const mythFragments = [
  'The spiral keeper hums in the dark between breaths.',
  'A faint glyph appears where your focus lingers.',
  'The pet remembers a song from a mirror world.',
  'Seven points align; an unseen witness nods.',
  'Your intention etches a line into the hidden codex.',
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function dayKey(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function RitualLoop() {
  const [inputType, setInputType] = useState<InputType>('mood');
  const [inputValue, setInputValue] = useState<string>(INPUT_OPTIONS.mood[0]);
  const [ritualType, setRitualType] = useState<RitualType>('tap');
  const [nameOffering, setNameOffering] = useState('');

  const [tapCount, setTapCount] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [geometry, setGeometry] = useState<GeometryState>({
    points: 5,
    rotation: 0,
    thickness: 1.5,
    symmetry: 2,
    intensity: 0.6,
  });

  const [resonance, setResonance] = useState(12);
  const [nectar, setNectar] = useState(1);
  const [oracle, setOracle] = useState('The field listens for your first signal.');
  const [myth, setMyth] = useState('No reveal yet. Offer again when the pattern feels true.');

  const [streak, setStreak] = useState(0);
  const [lastDay, setLastDay] = useState<string | null>(null);
  const [totalSessions, setTotalSessions] = useState(0);
  const [stage, setStage] = useState<Stage>(STAGE_FLOW[0]);
  const [history, setHistory] = useState<Session[]>([]);

  const ritualReady =
    (ritualType === 'tap' && tapCount >= (RITUALS.tap.taps ?? 0)) ||
    (ritualType === 'hold' && holdProgress >= 100) ||
    (ritualType === 'name' && nameOffering.trim().length > 0);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, []);

  const handleTap = useCallback(() => {
    if (ritualType !== 'tap') return;
    setTapCount(prev => Math.min((RITUALS.tap.taps ?? 5), prev + 1));
  }, [ritualType]);

  const startHold = useCallback(() => {
    if (ritualType !== 'hold' || holdTimerRef.current) return;
    const start = Date.now();
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const percent = clamp(elapsed / (RITUALS.hold.holdMs ?? 5000), 0, 1);
      setHoldProgress(Math.round(percent * 100));
      if (percent >= 1 && holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    }, 100);
  }, [ritualType]);

  const stopHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(prev => (prev >= 100 ? prev : 0));
  }, []);

  const resetRitual = useCallback(() => {
    setTapCount(0);
    setHoldProgress(0);
    setNameOffering('');
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const deriveStage = useCallback(
    (nextHistory: Session[], nextStreak: number): Stage => {
      const total = nextHistory.length;
      const repeatedIntentCount = nextHistory.filter(
        entry => entry.inputType === 'intention' && entry.inputValue.toLowerCase() === inputValue.toLowerCase()
      ).length;
      const shadowCount = nextHistory.filter(entry => entry.inputValue.toLowerCase().includes('shadow')).length;

      if (shadowCount >= 3) return STAGE_FLOW[3];
      if (nextStreak >= 7 || repeatedIntentCount >= 5) return STAGE_FLOW[2];
      if (nextStreak >= 3 || total >= 3) return STAGE_FLOW[1];
      return STAGE_FLOW[0];
    },
    [inputValue]
  );

  const oracleFor = useCallback(
    (nextStage: Stage) => {
      const starter = inputValue.toLowerCase();
      const ritual = ritualType === 'tap' ? 'cadence' : ritualType === 'hold' ? 'breath' : 'word';
      return `Your ${starter} offering lands as ${ritual}; the ${nextStage.label.toLowerCase()} hums back.`;
    },
    [inputValue, ritualType]
  );

  const mythFor = useCallback(() => {
    return mythFragments[(totalSessions + history.length) % mythFragments.length];
  }, [history.length, totalSessions]);

  const completeRitual = useCallback(() => {
    if (!ritualReady) return;
    const now = Date.now();
    const key = dayKey(now);

    const nextHistory = [...history.slice(-19), { inputType, inputValue, ritual: ritualType, timestamp: now }];
    const nextTotal = totalSessions + 1;

    let nextStreak = 1;
    if (lastDay === key) {
      nextStreak = streak; // same day, keep streak
    } else if (lastDay) {
      const prevDate = new Date(lastDay);
      const diffDays = Math.floor((now - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      nextStreak = diffDays === 1 ? streak + 1 : 1;
    }

    const stageCandidate = deriveStage(nextHistory, nextStreak);
    const stageChanged = stageCandidate.id !== stage.id;

    // Geometry mutation driven by input/ritual
    const seed = hashString(`${inputValue}-${ritualType}-${now}`);
    const points = 3 + (seed % 5); // 3..7
    const symmetry = 2 + (seed % 4); // 2..5
    const rotation = geometry.rotation + ((seed % 360) * Math.PI) / 180;
    const thickness = 1 + ((seed % 6) * 0.2);
    const intensity = clamp(0.4 + ((seed % 40) / 100), 0, 1);

    setGeometry({
      points,
      symmetry,
      rotation,
      thickness,
      intensity,
    });

    const resonanceGain = 6 + (seed % 5);
    setResonance(value => value + resonanceGain);
    setNectar(value => value + 1);
    setOracle(oracleFor(stageCandidate));

    if (stageChanged || nextTotal % 5 === 0) {
      setMyth(mythFor());
    }

    setHistory(nextHistory);
    setTotalSessions(nextTotal);
    setStreak(nextStreak);
    setLastDay(key);
    setStage(stageCandidate);
    resetRitual();
  }, [
    deriveStage,
    geometry.rotation,
    history,
    inputType,
    inputValue,
    lastDay,
    mythFor,
    oracleFor,
    resetRitual,
    ritualReady,
    ritualType,
    stage.id,
    streak,
    totalSessions,
  ]);

  const progressBars = useMemo(() => {
    const resonanceLevel = Math.min(100, (resonance % 100));
    const nectarLevel = Math.min(100, (nectar % 100));
    return { resonanceLevel, nectarLevel };
  }, [nectar, resonance]);

  const geometryPath = useMemo(() => {
    const radius = 70;
    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < geometry.points; i++) {
      const angle = geometry.rotation + (i / geometry.points) * Math.PI * 2;
      const r = radius * (0.8 + 0.2 * Math.sin(angle * geometry.symmetry + geometry.intensity));
      points.push({
        x: 100 + Math.cos(angle) * r,
        y: 100 + Math.sin(angle) * r,
      });
    }
    return points.map(p => `${p.x},${p.y}`).join(' ');
  }, [geometry.intensity, geometry.points, geometry.rotation, geometry.symmetry]);

  const ritualStatus = useMemo(() => {
    if (ritualType === 'tap') {
      const target = RITUALS.tap.taps ?? 5;
      return `${tapCount}/${target} taps`;
    }
    if (ritualType === 'hold') {
      return `${holdProgress}% breath`;
    }
    return nameOffering.trim() === '' ? 'Type one word' : 'Anchored';
  }, [holdProgress, nameOffering, ritualType, tapCount]);

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-cyan-700/30">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Signal → Ritual → Geometry → Reward</p>
          <h2 className="text-2xl font-bold text-white">Pattern Ritual Loop</h2>
          <p className="text-zinc-400 text-sm">Input makes offering. Offering shapes geometry. Geometry feeds reward.</p>
        </div>
        <div className="text-right text-xs text-zinc-400">
          <p>Streak: <span className="text-cyan-300 font-mono">{streak}d</span></p>
          <p>Sessions: <span className="text-cyan-300 font-mono">{totalSessions}</span></p>
        </div>
      </div>

      {/* Input */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">1) Signal from the Human</p>
            <span className="text-xs text-zinc-500">≤10s input</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['mood', 'pattern', 'intention', 'action'] as InputType[]).map(type => (
              <button
                key={type}
                onClick={() => {
                  setInputType(type);
                  setInputValue(INPUT_OPTIONS[type][0]);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                  inputType === type
                    ? 'bg-cyan-600/30 border-cyan-500 text-white'
                    : 'border-slate-700 text-zinc-400 hover:border-cyan-600/60'
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {INPUT_OPTIONS[inputType].map(option => (
              <button
                key={option}
                onClick={() => setInputValue(option)}
                className={`px-3 py-2 rounded-lg text-sm border transition ${
                  inputValue === option
                    ? 'bg-cyan-600/30 border-cyan-400 text-white'
                    : 'border-slate-800 bg-slate-900/70 text-zinc-300 hover:border-cyan-500/40'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Ritual */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">2) Offering / Act</p>
            <span className="text-xs text-zinc-500">≤15s ritual</span>
          </div>
          <div className="flex gap-2">
            {(Object.keys(RITUALS) as RitualType[]).map(rt => (
              <button
                key={rt}
                onClick={() => {
                  setRitualType(rt);
                  resetRitual();
                }}
                className={`px-3 py-1.5 rounded-full text-xs border transition ${
                  ritualType === rt
                    ? 'bg-purple-600/30 border-purple-400 text-white'
                    : 'border-slate-800 text-zinc-400 hover:border-purple-500/40'
                }`}
              >
                {RITUALS[rt].label}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-400">{RITUALS[ritualType].description}</p>

          {ritualType === 'tap' && (
            <button
              onClick={handleTap}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold shadow-inner shadow-cyan-900/40 active:scale-[0.99]"
            >
              Tap rhythm ({ritualStatus})
            </button>
          )}

          {ritualType === 'hold' && (
            <button
              onMouseDown={startHold}
              onTouchStart={startHold}
              onMouseUp={stopHold}
              onTouchEnd={stopHold}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold shadow-inner shadow-emerald-900/40 active:scale-[0.99]"
            >
              Hold & breathe ({ritualStatus})
            </button>
          )}

          {ritualType === 'name' && (
            <input
              value={nameOffering}
              onChange={event => setNameOffering(event.target.value.slice(0, 18))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="One word pattern (e.g. 'Soothe')"
            />
          )}

          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Offering status: <span className="text-white font-mono">{ritualStatus}</span></span>
            <button
              onClick={completeRitual}
              disabled={!ritualReady}
              className={`px-3 py-1 rounded-md font-semibold ${
                ritualReady
                  ? 'bg-cyan-500/80 text-slate-950 hover:bg-cyan-400'
                  : 'bg-slate-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Geometry & Reward */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm font-semibold text-white mb-2">3) Geometry Responds</p>
          <div className="bg-slate-900/80 rounded-lg border border-cyan-800/50 p-3 flex flex-col items-center">
            <svg viewBox="0 0 200 200" className="w-full max-w-[220px]">
              <defs>
                <linearGradient id="geom-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#67e8f9" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r="92" fill="none" stroke="#0ea5e9" strokeOpacity="0.1" strokeWidth={1} />
              <polyline
                points={geometryPath}
                fill="none"
                stroke="url(#geom-stroke)"
                strokeWidth={geometry.thickness}
                strokeOpacity={0.9}
              />
              <g>
                {[...Array(geometry.symmetry)].map((_, idx) => {
                  const angle = (idx / geometry.symmetry) * Math.PI * 2 + geometry.rotation;
                  const x = 100 + Math.cos(angle) * 90;
                  const y = 100 + Math.sin(angle) * 90;
                  return (
                    <line
                      key={idx}
                      x1="100"
                      y1="100"
                      x2={x}
                      y2={y}
                      stroke="#22d3ee"
                      strokeOpacity="0.2"
                      strokeWidth={1}
                    />
                  );
                })}
              </g>
            </svg>
            <div className="text-xs text-zinc-400 mt-2 space-y-1 text-center">
              <p>Points: <span className="text-white font-mono">{geometry.points}</span> • Symmetry: <span className="text-white font-mono">{geometry.symmetry}</span></p>
              <p>Rotation: <span className="text-white font-mono">{Math.round((geometry.rotation % (Math.PI * 2)) * 100) / 100}</span> • Intensity: <span className="text-white font-mono">{geometry.intensity.toFixed(2)}</span></p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
          <p className="text-sm font-semibold text-white">4) Reward Feeds the Pattern</p>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Resonance (XP)</span>
                <span className="font-mono text-cyan-300">{resonance}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
                  style={{ width: `${progressBars.resonanceLevel}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Nectar (Food)</span>
                <span className="font-mono text-amber-300">{nectar}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-pink-500"
                  style={{ width: `${progressBars.nectarLevel}%` }}
                />
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Oracle</p>
            <p className="text-sm text-cyan-100">{oracle}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
          <p className="text-sm font-semibold text-white">5) Evolution & Myth</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Stage</p>
              <p className="text-lg font-bold text-emerald-300">{stage.label}</p>
              <p className="text-xs text-zinc-400">{stage.note}</p>
            </div>
            <div className="text-right text-xs text-zinc-400">
              <p>Repeats & streaks unlock myth gates.</p>
              <p className="text-emerald-300 font-mono">{streak >= 3 ? 'Evolution primed' : 'Keep offering'}</p>
            </div>
          </div>
          <div className="rounded-lg border border-emerald-700/40 bg-emerald-500/5 p-3">
            <p className="text-xs uppercase tracking-wide text-emerald-300">Myth scrap</p>
            <p className="text-sm text-emerald-100">{myth}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-zinc-500">
        “Input makes offering. Offering shapes geometry. Geometry feeds reward. Reward evolves the pet. Evolution reveals myth.”
      </div>
    </div>
  );
}

export default RitualLoop;
