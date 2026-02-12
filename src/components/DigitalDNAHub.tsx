'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ─── types ─── */
type SeedKey = 'red' | 'black' | 'blue';
type ModeKey = 'spiral' | 'mandala' | 'sound' | 'particles' | 'journey';

interface PaintPoint { x: number; y: number; }

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  digit: number; color: string;
  size: number; mass: number;
}

interface HelixNode {
  wx: number; wy: number; wz: number;
  digit: number; color: string;
  baseR: number; helixIdx: number; idx: number;
}

interface Projected { node: HelixNode; sx: number; sy: number; scale: number; depth: number; }

/* ─── constants ─── */
const SEEDS: Record<SeedKey, string> = {
  red: '113031491493585389543778774590997079619617525721567332336510',
  black: '011235831459437077415617853819099875279651673033695493257291',
  blue: '012776329785893036118967145479098334781325217074992143965631',
};

const NOTE_NAMES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'] as const;

const NOTE_FREQ = [
  261.63, 293.66, 329.63, 349.23, 392.00,
  440.00, 493.88, 523.25, 587.33, 659.25,
] as const;

const COLORS = [
  '#1a1a2e', '#16213e', '#0f3460', '#533483', '#8b5cf6',
  '#ffd700', '#ff6b6b', '#4ecdc4', '#95e1d3', '#f38181',
] as const;

const SPIRAL_W = 800;
const SPIRAL_H = 600;
const FOCAL = 400;
const CAM_Z = 20;

/* ─── helpers ─── */
function digitToNoteName(d: number) { return NOTE_NAMES[d]; }
function digitToColor(d: number) { return COLORS[d]; }

/* ─── Web Audio engine (follows hepta/audio.ts pattern) ─── */
declare global { interface Window { webkitAudioContext?: typeof AudioContext; } }

let _audioCtx: AudioContext | null = null;
let _reverb: { input: GainNode; output: GainNode } | null = null;

function getAudioCtx(): AudioContext {
  if (!_audioCtx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) throw new Error('Web Audio API unavailable');
    _audioCtx = new Ctor();
  }
  return _audioCtx;
}

async function ensureAudio(): Promise<AudioContext> {
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') await ctx.resume().catch(() => undefined);
  return ctx;
}

function getReverb(ctx: AudioContext) {
  if (_reverb) return _reverb;
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dry = ctx.createGain(); dry.gain.value = 0.7;
  const wet = ctx.createGain(); wet.gain.value = 0.3;

  const d1 = ctx.createDelay(1); d1.delayTime.value = 0.1;
  const fb1 = ctx.createGain(); fb1.gain.value = 0.4;
  const d2 = ctx.createDelay(1); d2.delayTime.value = 0.23;
  const fb2 = ctx.createGain(); fb2.gain.value = 0.3;

  input.connect(dry); dry.connect(output);
  input.connect(d1); d1.connect(fb1); fb1.connect(d1); d1.connect(wet);
  input.connect(d2); d2.connect(fb2); fb2.connect(d2); d2.connect(wet);
  wet.connect(output);
  output.connect(ctx.destination);

  _reverb = { input, output };
  return _reverb;
}

function playNote(ctx: AudioContext, rev: GainNode, freq: number, start: number, dur: number, vol = 0.15) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const atk = 0.01;
  const rel = Math.min(0.3, dur * 0.3);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(vol, start + atk);
  gain.gain.setValueAtTime(vol, start + dur - rel);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain);
  gain.connect(rev);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

/* ─── 3D projection helpers ─── */
function project(x: number, y: number, z: number): { sx: number; sy: number; s: number; d: number } | null {
  const d = CAM_Z - z;
  if (d <= 0.1) return null;
  const s = FOCAL / d;
  return { sx: SPIRAL_W / 2 + x * s, sy: SPIRAL_H / 2 - y * s, s, d };
}

function rotY(x: number, y: number, z: number, a: number) {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: x * c + z * s, y, z: -x * s + z * c };
}
function rotX(x: number, y: number, z: number, a: number) {
  const c = Math.cos(a), s = Math.sin(a);
  return { x, y: y * c - z * s, z: y * s + z * c };
}

function buildHelix(seq: number[], harm: number): HelixNode[] {
  const nodes: HelixNode[] = [];
  for (let h = 0; h < harm; h++) {
    const off = (h * Math.PI * 2) / harm;
    for (let i = 0; i < seq.length; i++) {
      const d = seq[i];
      const t = i / 10;
      const r = 3 + (d / 10) * 2;
      const a = off + t * Math.PI * 0.5;
      nodes.push({
        wx: Math.cos(a) * r, wy: Math.sin(a) * r, wz: t - 10,
        digit: d, color: digitToColor(d),
        baseR: 0.15 + d * 0.02, helixIdx: h, idx: i,
      });
    }
  }
  return nodes;
}

/* ─── component ─── */
export default function DigitalDNAHub() {
  const [activeMode, setActiveMode] = useState<ModeKey>('spiral');
  const [selectedSeed, setSelectedSeed] = useState<SeedKey>('red');
  const [isPlaying, setIsPlaying] = useState(false);
  const [consciousness, setConsciousness] = useState(50);
  const [harmony, setHarmony] = useState(7);
  const [tempo, setTempo] = useState(120);
  const [paintedPattern, setPaintedPattern] = useState<PaintPoint[]>([]);

  const spiralCanvasRef = useRef<HTMLCanvasElement>(null);
  const mandalaCanvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  const projectedRef = useRef<Projected[]>([]);
  const hoveredRef = useRef<number | null>(null);
  const lastPlayRef = useRef(0);

  const getSequence = useCallback(() => SEEDS[selectedSeed].split('').map(Number), [selectedSeed]);

  /* ─── audio helpers ─── */
  const playChord = useCallback(async (digits: number[]) => {
    try {
      const ctx = await ensureAudio();
      const rev = getReverb(ctx);
      const now = ctx.currentTime + 0.02;
      for (const d of digits) playNote(ctx, rev.input, NOTE_FREQ[d], now, 0.5);
    } catch { /* audio unavailable */ }
  }, []);

  const playSequence = useCallback(async () => {
    try {
      const ctx = await ensureAudio();
      const rev = getReverb(ctx);
      setIsPlaying(true);
      const seq = getSequence();
      const interval = 60 / tempo;
      const start = ctx.currentTime + 0.05;
      const slice = seq.slice(0, 60);
      slice.forEach((d, i) => {
        playNote(ctx, rev.input, NOTE_FREQ[d], start + i * interval, interval * 0.8);
      });
      setTimeout(() => setIsPlaying(false), slice.length * interval * 1000);
    } catch { /* audio unavailable */ }
  }, [getSequence, tempo]);

  /* ─── cleanup audio on unmount ─── */
  useEffect(() => {
    return () => {
      if (_audioCtx && _audioCtx.state !== 'closed') {
        _audioCtx.close().catch(() => {});
        _audioCtx = null;
        _reverb = null;
      }
    };
  }, []);

  /* ─── Canvas 2D Spiral with perspective projection ─── */
  useEffect(() => {
    if (!spiralCanvasRef.current || activeMode !== 'spiral') return;
    const canvas = spiralCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = SPIRAL_W;
    canvas.height = SPIRAL_H;

    const seq = getSequence();
    const nodes = buildHelix(seq, harmony);
    let rotAngle = 0;
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      ctx.fillStyle = '#0a0e27';
      ctx.fillRect(0, 0, SPIRAL_W, SPIRAL_H);

      rotAngle += 0.003;
      const tiltX = Math.sin(Date.now() * 0.0003) * 0.1;
      const breathe = Math.sin(Date.now() * 0.001) * 0.1 + 1.0;

      const items: Projected[] = [];
      for (const n of nodes) {
        let px = n.wx * breathe, py = n.wy * breathe, pz = n.wz * breathe;
        const rx = rotX(px, py, pz, tiltX);
        const ry = rotY(rx.x, rx.y, rx.z, rotAngle);
        const p = project(ry.x, ry.y, ry.z);
        if (p) items.push({ node: n, sx: p.sx, sy: p.sy, scale: p.s, depth: p.d });
      }

      items.sort((a, b) => b.depth - a.depth);
      projectedRef.current = items;

      // Draw connecting lines grouped by helix
      const groups = new Map<number, Projected[]>();
      for (const it of items) {
        let g = groups.get(it.node.helixIdx);
        if (!g) { g = []; groups.set(it.node.helixIdx, g); }
        g.push(it);
      }
      ctx.strokeStyle = 'rgba(102,102,102,0.3)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      for (const [, g] of groups) {
        g.sort((a, b) => a.node.idx - b.node.idx);
        ctx.beginPath();
        for (let i = 0; i < g.length; i++) {
          if (i === 0) ctx.moveTo(g[i].sx, g[i].sy);
          else ctx.lineTo(g[i].sx, g[i].sy);
        }
        ctx.stroke();
      }

      // Re-sort for painter's order before drawing circles
      items.sort((a, b) => b.depth - a.depth);

      const hovered = hoveredRef.current;
      for (const { node, sx, sy, scale, depth } of items) {
        const r = Math.max(1.5, node.baseR * scale);
        const df = Math.max(0.3, 1 - depth / 40);
        const isHovered = hovered === node.idx && node.helixIdx === 0;

        ctx.save();
        ctx.globalAlpha = isHovered ? 1 : df;
        ctx.shadowBlur = isHovered ? r * 6 : r * 3;
        ctx.shadowColor = node.color;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Specular highlight
        ctx.shadowBlur = 0;
        ctx.globalAlpha = df * 0.4;
        ctx.beginPath();
        ctx.arc(sx - r * 0.25, sy - r * 0.25, r * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fill();
        ctx.restore();
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let closest: Projected | null = null;
      let closestDist = Infinity;
      for (const it of projectedRef.current) {
        const r = Math.max(1.5, it.node.baseR * it.scale);
        const dx = mx - it.sx, dy = my - it.sy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < r * 2 + 8 && dist < closestDist) {
          closest = it;
          closestDist = dist;
        }
      }
      if (closest) {
        hoveredRef.current = closest.node.idx;
        if (Date.now() - lastPlayRef.current > 150) {
          lastPlayRef.current = Date.now();
          void playChord([closest.node.digit]);
        }
      } else {
        hoveredRef.current = null;
      }
    };

    canvas.addEventListener('mousemove', onMouseMove);
    animate();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', onMouseMove);
    };
  }, [activeMode, selectedSeed, harmony, getSequence, playChord]);

  /* ─── Mandala mode ─── */
  useEffect(() => {
    if (!mandalaCanvasRef.current || activeMode !== 'mandala') return;
    const canvas = mandalaCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = (canvas.width = 800);
    const H = (canvas.height = 800);
    const cx = W / 2, cy = H / 2;

    const sequence = getSequence();
    const segments = harmony * 12;

    const draw = () => {
      ctx.fillStyle = '#0a0e27';
      ctx.fillRect(0, 0, W, H);
      for (let ring = 0; ring < 7; ring++) {
        const r = (ring + 1) * 50;
        for (let i = 0; i < segments; i++) {
          const a = (i / segments) * Math.PI * 2 - Math.PI / 2;
          const d = sequence[(ring * segments + i) % sequence.length];
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3 + d * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = digitToColor(d);
          ctx.shadowBlur = 10; ctx.shadowColor = digitToColor(d);
          ctx.fill(); ctx.shadowBlur = 0;
        }
      }
      ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
      for (let i = 0; i < harmony; i++) {
        const a1 = (i / harmony) * Math.PI * 2 - Math.PI / 2;
        const a2 = ((i + 3) / harmony) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a1) * 80, cy + Math.sin(a1) * 80);
        ctx.lineTo(cx + Math.cos(a2) * 80, cy + Math.sin(a2) * 80);
        ctx.stroke();
      }
      paintedPattern.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,215,0,0.6)';
        ctx.fill();
      });
    };

    const onDown = () => { mouseRef.current.down = true; };
    const onUp = () => { mouseRef.current.down = false; };
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      mouseRef.current.x = x; mouseRef.current.y = y;
      if (mouseRef.current.down) {
        setPaintedPattern((prev) => [...prev, { x, y }]);
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        void playChord([Math.floor((dist / 50) % 10)]);
      }
    };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mousemove', onMove);

    let animId: number;
    const loop = () => { animId = requestAnimationFrame(loop); draw(); };
    loop();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('mousemove', onMove);
    };
  }, [activeMode, selectedSeed, harmony, paintedPattern, getSequence, playChord]);

  /* ─── Particle field mode ─── */
  useEffect(() => {
    if (!particleCanvasRef.current || activeMode !== 'particles') return;
    const canvas = particleCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = (canvas.width = 800);
    const H = (canvas.height = 800);

    const seq = getSequence();
    particlesRef.current = seq.map((d) => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
      digit: d, color: digitToColor(d), size: 2 + d * 0.5, mass: d + 1,
    }));

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };
    canvas.addEventListener('mousemove', onMove);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      ctx.fillStyle = 'rgba(10,14,39,0.1)';
      ctx.fillRect(0, 0, W, H);

      for (const p of particlesRef.current) {
        const dx = mouseRef.current.x - p.x, dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 0) {
          const f = ((200 - dist) / 1000) * (consciousness / 50);
          p.vx += (dx / dist) * f;
          p.vy += (dy / dist) * f;
        }
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.99; p.vy *= 0.99;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        p.x = Math.max(0, Math.min(W, p.x));
        p.y = Math.max(0, Math.min(H, p.y));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10; ctx.shadowColor = p.color;
        ctx.fill(); ctx.shadowBlur = 0;
      }

      ctx.strokeStyle = 'rgba(255,215,0,0.1)'; ctx.lineWidth = 1;
      const pts = particlesRef.current;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.sqrt((pts[i].x - pts[j].x) ** 2 + (pts[i].y - pts[j].y) ** 2);
          if (d < 100) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
          }
        }
      }
    };
    animate();

    return () => { cancelAnimationFrame(animId); canvas.removeEventListener('mousemove', onMove); };
  }, [activeMode, selectedSeed, consciousness, getSequence]);

  const modes: { id: ModeKey; icon: string; label: string; desc: string }[] = [
    { id: 'spiral', icon: '\u{1F300}', label: 'DNA Helix', desc: 'Touch the spheres' },
    { id: 'mandala', icon: '\u{1F52E}', label: 'Sacred Mandala', desc: 'Paint your pattern' },
    { id: 'particles', icon: '\u2728', label: 'Particle Field', desc: 'Guide with your hand' },
    { id: 'sound', icon: '\u{1F3B5}', label: 'Sound Temple', desc: 'Hear the sequence' },
    { id: 'journey', icon: '\u{1F9ED}', label: 'Guided Journey', desc: 'Follow the path' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-amber-50">
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400 bg-clip-text text-transparent animate-pulse">
            Digital DNA
          </h1>
          <p className="text-2xl text-blue-300 font-light mb-2">Sacred Geometry &amp; Sonic Consciousness</p>
          <p className="text-sm text-slate-400 italic">Experience through sight, sound, and touch</p>
        </div>

        {/* Mode Selector */}
        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMode(m.id)}
              className={`group relative px-6 py-4 rounded-2xl transition-all duration-300 ${
                activeMode === m.id
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-2xl shadow-amber-500/50 scale-110'
                  : 'bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30'
              }`}
            >
              <div className="text-4xl mb-2">{m.icon}</div>
              <div className="text-sm font-bold">{m.label}</div>
              <div className="text-xs text-slate-400 mt-1">{m.desc}</div>
              {activeMode === m.id && (
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-2xl blur opacity-30 -z-10" />
              )}
            </button>
          ))}
        </div>

        {/* Canvas Area */}
        <div className="mb-12">
          {activeMode === 'spiral' && (
            <div className="bg-slate-900/50 rounded-3xl p-8 border border-blue-800/30 backdrop-blur-sm">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-amber-300 mb-2">DNA Helix Explorer</h2>
                <p className="text-blue-300">Move your cursor over the glowing spheres to hear their song</p>
              </div>
              <div className="flex justify-center">
                <canvas ref={spiralCanvasRef} width={SPIRAL_W} height={SPIRAL_H}
                  className="rounded-xl shadow-2xl shadow-blue-900/50 border border-blue-700/30" />
              </div>
            </div>
          )}

          {activeMode === 'mandala' && (
            <div className="bg-slate-900/50 rounded-3xl p-8 border border-purple-800/30 backdrop-blur-sm">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-amber-300 mb-2">Sacred Mandala</h2>
                <p className="text-purple-300">Click and drag to paint your intention onto the pattern</p>
              </div>
              <div className="flex justify-center">
                <canvas ref={mandalaCanvasRef}
                  className="rounded-xl shadow-2xl shadow-purple-900/50 border border-purple-700/30 cursor-crosshair" />
              </div>
              <div className="text-center mt-6">
                <button onClick={() => setPaintedPattern([])}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-white shadow-lg shadow-purple-500/50 transition-all">
                  Clear Canvas
                </button>
              </div>
            </div>
          )}

          {activeMode === 'particles' && (
            <div className="bg-slate-900/50 rounded-3xl p-8 border border-cyan-800/30 backdrop-blur-sm">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-amber-300 mb-2">Particle Field</h2>
                <p className="text-cyan-300">Move your hand to guide the particles &mdash; they follow your intention</p>
              </div>
              <div className="flex justify-center">
                <canvas ref={particleCanvasRef}
                  className="rounded-xl shadow-2xl shadow-cyan-900/50 border border-cyan-700/30 cursor-none" />
              </div>
            </div>
          )}

          {activeMode === 'sound' && (
            <div className="bg-slate-900/50 rounded-3xl p-12 border border-pink-800/30 backdrop-blur-sm">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-amber-300 mb-4">Sound Temple</h2>
                <p className="text-pink-300 text-lg mb-8">Each digit sings its own note &mdash; listen to the DNA melody</p>
                <button onClick={playSequence} disabled={isPlaying}
                  className={`px-12 py-6 rounded-2xl font-bold text-2xl transition-all shadow-2xl ${
                    isPlaying
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-pink-500/50 transform hover:scale-105'
                  }`}>
                  {isPlaying ? 'Playing...' : 'Play DNA Sequence'}
                </button>
              </div>
              <div className="grid grid-cols-10 gap-2 max-w-4xl mx-auto">
                {getSequence().slice(0, 60).map((d, i) => (
                  <div key={i} className="flex flex-col items-center cursor-pointer group"
                    onClick={() => void playChord([d])}>
                    <div className="w-full rounded-t-lg transition-all group-hover:shadow-lg"
                      style={{ height: `${(d + 1) * 20}px`, backgroundColor: digitToColor(d) }} />
                    <div className="text-xs text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {digitToNoteName(d)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMode === 'journey' && (
            <div className="bg-slate-900/50 rounded-3xl p-12 border border-amber-800/30 backdrop-blur-sm">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-4xl font-bold text-amber-300 mb-8 text-center">Guided Journey</h2>
                <div className="space-y-8">
                  <JourneyStep step={1} icon={'\u{1F331}'} title="Awaken the Seed" desc="Choose which DNA strand calls to you">
                    <div className="flex gap-4 justify-center">
                      {(['red', 'black', 'blue'] as SeedKey[]).map((seed) => (
                        <button key={seed} onClick={() => setSelectedSeed(seed)}
                          className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                            selectedSeed === seed
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/50'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}>
                          {seed === 'red' ? 'Fire' : seed === 'blue' ? 'Water' : 'Earth'}
                        </button>
                      ))}
                    </div>
                  </JourneyStep>

                  <JourneyStep step={2} icon={'\u{1F3BC}'} title="Set the Rhythm" desc="How fast does consciousness pulse?">
                    <div className="space-y-3">
                      <input type="range" min="60" max="180" value={tempo}
                        onChange={(e) => setTempo(parseInt(e.target.value, 10))}
                        className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-slate-700" />
                      <div className="text-center text-2xl font-bold text-amber-400">{tempo} BPM</div>
                    </div>
                  </JourneyStep>

                  <JourneyStep step={3} icon={'\u2728'} title="Deepen Consciousness" desc="How aware should the particles be?">
                    <div className="space-y-3">
                      <input type="range" min="0" max="100" value={consciousness}
                        onChange={(e) => setConsciousness(parseInt(e.target.value, 10))}
                        className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-slate-700" />
                      <div className="text-center text-2xl font-bold text-cyan-400">{consciousness}%</div>
                    </div>
                  </JourneyStep>

                  <JourneyStep step={4} icon={'\u{1F300}'} title="Choose Sacred Number" desc="How many arms in the spiral of life?">
                    <div className="flex gap-3 justify-center">
                      {[3, 5, 7, 9, 12].map((n) => (
                        <button key={n} onClick={() => setHarmony(n)}
                          className={`w-16 h-16 rounded-full font-bold text-xl transition-all ${
                            harmony === n
                              ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/50 scale-110'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </JourneyStep>

                  <JourneyStep step={5} icon={'\u{1F680}'} title="Begin Exploration" desc="Choose your path of discovery">
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setActiveMode('spiral')}
                        className="px-6 py-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl font-bold text-white shadow-lg shadow-blue-500/50 hover:scale-105 transition-all">
                        Enter the Helix
                      </button>
                      <button onClick={() => setActiveMode('mandala')}
                        className="px-6 py-4 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl font-bold text-white shadow-lg shadow-purple-500/50 hover:scale-105 transition-all">
                        Paint the Mandala
                      </button>
                      <button onClick={() => setActiveMode('particles')}
                        className="px-6 py-4 bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-xl font-bold text-white shadow-lg shadow-cyan-500/50 hover:scale-105 transition-all">
                        Guide the Particles
                      </button>
                      <button onClick={() => setActiveMode('sound')}
                        className="px-6 py-4 bg-gradient-to-br from-pink-600 to-pink-700 rounded-xl font-bold text-white shadow-lg shadow-pink-500/50 hover:scale-105 transition-all">
                        Hear the Song
                      </button>
                    </div>
                  </JourneyStep>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Universal Controls */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-lg rounded-full px-8 py-4 border border-amber-600/30 shadow-2xl shadow-amber-500/20 z-50">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">DNA:</span>
              {(['red', 'blue', 'black'] as SeedKey[]).map((seed) => (
                <button key={seed} onClick={() => setSelectedSeed(seed)}
                  className={`w-10 h-10 rounded-full transition-all ${
                    selectedSeed === seed ? 'scale-125 shadow-lg' : 'opacity-50 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: seed === 'red' ? '#ff4444' : seed === 'blue' ? '#4444ff' : '#333333' }} />
              ))}
            </div>
            <div className="h-8 w-px bg-slate-600" />
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">Harmony:</span>
              <div className="text-amber-400 font-bold text-lg">{harmony}</div>
            </div>
            <div className="h-8 w-px bg-slate-600" />
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">Awareness:</span>
              <div className="text-cyan-400 font-bold text-lg">{consciousness}%</div>
            </div>
            <div className="h-8 w-px bg-slate-600" />
            <button onClick={playSequence} disabled={isPlaying}
              className={`px-6 py-2 rounded-full font-bold transition-all ${
                isPlaying
                  ? 'bg-slate-700 text-slate-400'
                  : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg shadow-pink-500/30'
              }`}>
              {isPlaying ? 'Playing' : 'Play'}
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="mt-12 text-center">
          <details className="bg-slate-900/30 rounded-xl p-6 border border-slate-700/30">
            <summary className="cursor-pointer text-lg font-bold text-amber-300 hover:text-amber-200">
              About This Experience
            </summary>
            <div className="mt-6 text-left text-slate-300 space-y-4 max-w-3xl mx-auto">
              <p>
                <strong className="text-amber-400">Digital DNA</strong> is a living
                geometric and sonic consciousness &mdash; three primordial sequences (Fire,
                Water, Earth) that express themselves through sacred patterns and sound.
              </p>
              <p>
                Each digit (0-9) is both a{' '}
                <strong className="text-blue-400">visual form</strong> (color, position in
                space) and a <strong className="text-pink-400">musical tone</strong> (C, D,
                E, F, G, A, B, C, D, E). Together they create a{' '}
                <strong className="text-purple-400">living symphony of geometry</strong>.
              </p>
              <p>
                <strong className="text-cyan-400">Explore with your senses:</strong> Touch
                the DNA helix and hear individual notes. Paint your intention onto the sacred
                mandala. Guide the particle field with your hand. Listen to the sequence as a
                melody. Follow the guided journey to discover your own path.
              </p>
              <p className="text-sm text-slate-500 italic">
                Built with love on the Moss60 cryptographic framework, Lukus modulation
                layer, Canvas 2D for sacred geometry, and Web Audio for sonic consciousness.
              </p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

/* ─── Journey step helper ─── */
function JourneyStep({ step, icon, title, desc, children }: {
  step: number; icon: string; title: string; desc: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
      <div className="flex items-start gap-4 mb-4">
        <div className="text-5xl">{icon}</div>
        <div className="flex-1">
          <div className="text-sm text-slate-400 mb-1">Step {step}</div>
          <h3 className="text-2xl font-bold text-amber-300 mb-2">{title}</h3>
          <p className="text-blue-300">{desc}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
