'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import * as Tone from 'tone';
import { useEducationStore } from '@/lib/education';

export interface LessonContext {
  lessonId: string;
  studentAlias: string;
  prePrompt: string | null;
  postPrompt: string | null;
}

type SeedKey = 'red' | 'black' | 'blue';
type ModeKey = 'spiral' | 'mandala' | 'sound' | 'particles' | 'journey';

interface PaintPoint {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  digit: number;
  color: string;
  size: number;
  mass: number;
}

const SEEDS: Record<SeedKey, string> = {
  red: '113031491493585389543778774590997079619617525721567332336510',
  black: '011235831459437077415617853819099875279651673033695493257291',
  blue: '012776329785893036118967145479098334781325217074992143965631',
};

const SCALE = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'] as const;

const COLORS = [
  '#1a1a2e', '#16213e', '#0f3460', '#533483', '#8b5cf6',
  '#ffd700', '#ff6b6b', '#4ecdc4', '#95e1d3', '#f38181',
] as const;

function digitToNote(digit: number): string {
  return SCALE[digit];
}

function digitToColor(digit: number): string {
  return COLORS[digit];
}

/** Returns canvas dimensions based on viewport — capped for performance */
function getCanvasDims(aspect: '4:3' | '1:1' = '4:3') {
  if (typeof window === 'undefined') return { w: 800, h: 600 };
  // Leave 32 px padding on each side, cap at 800
  const w = Math.min(window.innerWidth - 32, 800);
  const h = aspect === '1:1' ? w : Math.round(w * 0.75);
  return { w, h };
}

/** Normalize a TouchEvent touch position to canvas local coords */
function touchPos(e: TouchEvent, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const t = e.touches[0] ?? e.changedTouches[0];
  return { x: t.clientX - rect.left, y: t.clientY - rect.top };
}

export default function DigitalDNAHub({ lessonContext }: { lessonContext?: LessonContext }) {
  const [activeMode, setActiveMode] = useState<ModeKey>('spiral');
  const [selectedSeed, setSelectedSeed] = useState<SeedKey>('red');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [consciousness, setConsciousness] = useState(50);
  const [harmony, setHarmony] = useState(7);
  const [tempo, setTempo] = useState(120);
  const [paintedPattern, setPaintedPattern] = useState<PaintPoint[]>([]);
  const [showPostPrompt, setShowPostPrompt] = useState(false);
  const [postResponse, setPostResponse] = useState('');
  const [preAcknowledged, setPreAcknowledged] = useState(!lessonContext?.prePrompt);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'saving' | 'ready'>('idle');

  const incrementDnaInteraction = useEducationStore((s) => s.incrementDnaInteraction);
  const recordPostResponse = useEducationStore((s) => s.recordPostResponse);
  const completeLesson = useEducationStore((s) => s.completeLesson);
  const interactionCountRef = useRef(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  const paintedPatternRef = useRef<PaintPoint[]>([]);

  // ── Education tracking ──────────────────────────────────────────────────────
  const trackInteraction = useCallback(() => {
    if (!lessonContext) return;
    interactionCountRef.current += 1;
    if (interactionCountRef.current % 5 === 0) {
      incrementDnaInteraction(lessonContext.lessonId, lessonContext.studentAlias);
    }
  }, [lessonContext, incrementDnaInteraction]);

  useEffect(() => {
    return () => {
      if (lessonContext && interactionCountRef.current % 5 !== 0) {
        incrementDnaInteraction(lessonContext.lessonId, lessonContext.studentAlias);
      }
    };
  }, [lessonContext, incrementDnaInteraction]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getSequence = useCallback(
    () => SEEDS[selectedSeed].split('').map(Number),
    [selectedSeed],
  );

  const playChord = useCallback(
    (digits: number[]) => {
      if (!audioInitialized || !synthRef.current) return;
      const notes = digits.map(digitToNote);
      synthRef.current.triggerAttackRelease(notes, '4n');
    },
    [audioInitialized],
  );

  // ── ASMR synth — sine wave + reverb for that soothing texture ───────────────
  useEffect(() => {
    if (typeof window === 'undefined' || synthRef.current) return;
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.15, decay: 0.3, sustain: 0.4, release: 2.0 },
    }).toDestination();

    const reverb = new Tone.Reverb({ decay: 5, wet: 0.45 }).toDestination();
    const chorus = new Tone.Chorus(2, 2.5, 0.5).toDestination().start();
    synth.connect(reverb);
    synth.connect(chorus);
    synthRef.current = synth;
  }, []);

  const playSequence = useCallback(async () => {
    if (!audioInitialized) {
      await Tone.start();
      setAudioInitialized(true);
    }
    setIsPlaying(true);
    const sequence = getSequence();
    const now = Tone.now();
    const interval = 60 / tempo;

    sequence.slice(0, 60).forEach((digit, i) => {
      const note = digitToNote(digit);
      const time = now + i * interval;
      const duration = interval * 0.85;
      synthRef.current?.triggerAttackRelease(note, duration, time);
    });

    setTimeout(
      () => setIsPlaying(false),
      sequence.slice(0, 60).length * interval * 1000,
    );
  }, [audioInitialized, getSequence, tempo]);

  // ── 3D Spiral — mobile-responsive ───────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || activeMode !== 'spiral') return;

    const canvas = canvasRef.current;
    const { w, h } = getCanvasDims('4:3');

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);

    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const pl1 = new THREE.PointLight(0xffd700, 1.5);
    pl1.position.set(10, 10, 10);
    scene.add(pl1);
    const pl2 = new THREE.PointLight(0x4444ff, 1.0);
    pl2.position.set(-10, -10, 5);
    scene.add(pl2);

    const sequence = getSequence();
    const group = new THREE.Group();

    for (let helix = 0; helix < harmony; helix++) {
      const helixGroup = new THREE.Group();
      const angleOffset = (helix * Math.PI * 2) / harmony;

      for (let i = 0; i < sequence.length; i++) {
        const digit = sequence[i];
        const t = i / 10;
        const radius = 3 + (digit / 10) * 2;
        const angle = angleOffset + t * Math.PI * 0.5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const z = t - 10;

        const geo = new THREE.SphereGeometry(0.15 + digit * 0.02, 16, 16);
        const mat = new THREE.MeshPhongMaterial({
          color: new THREE.Color(digitToColor(digit)),
          emissive: new THREE.Color(digitToColor(digit)),
          emissiveIntensity: 0.5,
          shininess: 100,
        });
        const sphere = new THREE.Mesh(geo, mat);
        sphere.position.set(x, y, z);
        sphere.userData = { digit, index: i };
        helixGroup.add(sphere);

        if (i > 0) {
          const prevAngle = angleOffset + ((i - 1) / 10) * Math.PI * 0.5;
          const prevRadius = 3 + (sequence[i - 1] / 10) * 2;
          const lineGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(
              Math.cos(prevAngle) * prevRadius,
              Math.sin(prevAngle) * prevRadius,
              (i - 1) / 10 - 10,
            ),
            new THREE.Vector3(x, y, z),
          ]);
          const lineMat = new THREE.LineBasicMaterial({
            color: 0x666666,
            opacity: 0.3,
            transparent: true,
          });
          helixGroup.add(new THREE.Line(lineGeo, lineMat));
        }
      }
      group.add(helixGroup);
    }
    scene.add(group);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const castRay = (cx: number, cy: number) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((cx - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((cy - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        const obj = intersects[0].object as THREE.Mesh<
          THREE.BufferGeometry,
          THREE.MeshPhongMaterial
        >;
        if (obj.userData.digit !== undefined) {
          obj.material.emissiveIntensity = 1.0;
          if (audioInitialized) playChord([obj.userData.digit as number]);
          trackInteraction();
          setTimeout(() => { if (obj.material) obj.material.emissiveIntensity = 0.5; }, 200);
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => castRay(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      if (t) castRay(t.clientX, t.clientY);
    };
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      group.rotation.y += 0.003;
      group.rotation.x = Math.sin(Date.now() * 0.0003) * 0.1;
      const b = Math.sin(Date.now() * 0.001) * 0.1 + 1.0;
      group.scale.set(b, b, b);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchmove', onTouchMove);
      scene.remove(group);
      group.traverse((object) => {
        const o = object as THREE.Object3D & {
          geometry?: THREE.BufferGeometry;
          material?: THREE.Material | THREE.Material[];
        };
        o.geometry?.dispose();
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material?.dispose();
      });
      renderer.dispose();
    };
  }, [activeMode, selectedSeed, harmony, audioInitialized, getSequence, playChord, trackInteraction]);

  // ── Mandala — mobile-responsive + touch ─────────────────────────────────────
  useEffect(() => {
    if (!particleCanvasRef.current || activeMode !== 'mandala') return;

    const canvas = particleCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { w } = getCanvasDims('1:1');
    const W = (canvas.width = w);
    const H = (canvas.height = w);
    const cx = W / 2;
    const cy = H / 2;

    const sequence = getSequence();
    const segments = harmony * 12;

    const drawMandala = () => {
      ctx.fillStyle = '#0a0e27';
      ctx.fillRect(0, 0, W, H);

      for (let ring = 0; ring < 7; ring++) {
        const radius = (ring + 1) * (W / 16);
        for (let i = 0; i < segments; i++) {
          const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
          const digit = sequence[(ring * segments + i) % sequence.length];
          const x = cx + Math.cos(angle) * radius;
          const y = cy + Math.sin(angle) * radius;
          ctx.beginPath();
          ctx.arc(x, y, 3 + digit * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = digitToColor(digit);
          ctx.shadowBlur = 10;
          ctx.shadowColor = digitToColor(digit);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      for (let i = 0; i < harmony; i++) {
        const a1 = (i / harmony) * Math.PI * 2 - Math.PI / 2;
        const a2 = ((i + 3) / harmony) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a1) * (W / 10), cy + Math.sin(a1) * (W / 10));
        ctx.lineTo(cx + Math.cos(a2) * (W / 10), cy + Math.sin(a2) * (W / 10));
        ctx.stroke();
      }

      paintedPatternRef.current.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.fill();
      });
    };

    const paintAt = (x: number, y: number) => {
      paintedPatternRef.current.push({ x, y });
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const digit = Math.floor((dist / (W / 16)) % 10);
      if (audioInitialized) playChord([digit]);
      trackInteraction();
    };

    const onDown = () => { mouseRef.current.down = true; };
    const onUp = () => {
      mouseRef.current.down = false;
      setPaintedPattern([...paintedPatternRef.current]);
    };
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseRef.current.x = x; mouseRef.current.y = y;
      if (mouseRef.current.down) paintAt(x, y);
    };
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      mouseRef.current.down = true;
      const { x, y } = touchPos(e, canvas);
      paintAt(x, y);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!mouseRef.current.down) return;
      const { x, y } = touchPos(e, canvas);
      paintAt(x, y);
    };
    const onTouchEnd = () => {
      mouseRef.current.down = false;
      setPaintedPattern([...paintedPatternRef.current]);
    };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    let animId: number;
    const loop = () => { animId = requestAnimationFrame(loop); drawMandala(); };
    loop();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [activeMode, selectedSeed, harmony, audioInitialized, getSequence, playChord, trackInteraction]);

  useEffect(() => {
    paintedPatternRef.current = paintedPattern;
  }, [paintedPattern]);

  const clearPaintedPattern = () => {
    paintedPatternRef.current = [];
    setPaintedPattern([]);
  };

  // ── Particle field — mobile-responsive + touch ───────────────────────────────
  useEffect(() => {
    if (!particleCanvasRef.current || activeMode !== 'particles') return;

    const canvas = particleCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { w } = getCanvasDims('1:1');
    const W = (canvas.width = w);
    const H = (canvas.height = w);

    const sequence = getSequence();
    particlesRef.current = sequence.map((digit) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      digit,
      color: digitToColor(digit),
      size: 2 + digit * 0.5,
      mass: digit + 1,
    }));

    const updateMouse = (x: number, y: number) => {
      mouseRef.current.x = x; mouseRef.current.y = y;
    };
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      updateMouse(e.clientX - rect.left, e.clientY - rect.top);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const { x, y } = touchPos(e, canvas);
      updateMouse(x, y);
    };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      ctx.fillStyle = 'rgba(10, 14, 39, 0.1)';
      ctx.fillRect(0, 0, W, H);

      for (const p of particlesRef.current) {
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          const safeDist = Math.max(dist, 0.0001);
          const force = ((200 - dist) / 1000) * (consciousness / 50);
          p.vx += (dx / safeDist) * force;
          p.vy += (dy / safeDist) * force;
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
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.strokeStyle = 'rgba(255, 215, 0, 0.1)';
      ctx.lineWidth = 1;
      const pts = particlesRef.current;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.sqrt((pts[i].x - pts[j].x) ** 2 + (pts[i].y - pts[j].y) ** 2);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('touchmove', onTouchMove);
    };
  }, [activeMode, selectedSeed, consciousness, getSequence]);

  const initAudioAndPlay = async () => {
    if (!audioInitialized) {
      await Tone.start();
      setAudioInitialized(true);
    }
    playSequence();
  };

  // ── Update with MetaPet protection ──────────────────────────────────────────
  const handleUpdate = useCallback(async () => {
    setUpdateStatus('saving');
    // MetaPet data lives in IndexedDB — it survives page reloads automatically.
    // We just pause briefly so any in-flight writes can settle before reload.
    await new Promise((r) => setTimeout(r, 600));
    setUpdateStatus('ready');
    await new Promise((r) => setTimeout(r, 300));
    window.location.reload();
  }, []);

  const modes: { id: ModeKey; icon: string; label: string; desc: string }[] = [
    { id: 'spiral',    icon: '\u{1F300}', label: 'DNA Helix',      desc: 'Touch the spheres' },
    { id: 'mandala',   icon: '\u{1F52E}', label: 'Sacred Mandala', desc: 'Paint your pattern' },
    { id: 'particles', icon: '\u2728',    label: 'Particle Field',  desc: 'Guide with touch' },
    { id: 'sound',     icon: '\u{1F3B5}', label: 'Sound Temple',    desc: 'Hear the sequence' },
    { id: 'journey',   icon: '\u{1F9ED}', label: 'Guided Journey',  desc: 'Follow the path' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-amber-50">
      {/* Cosmic Background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-6xl font-bold mb-3 bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400 bg-clip-text text-transparent animate-pulse">
            ✨ Digital DNA ✨
          </h1>
          <p className="text-lg sm:text-2xl text-blue-300 font-light mb-1">
            Sacred Geometry &amp; Sonic Consciousness
          </p>
          {lessonContext && (
            <p className="text-xs text-cyan-300 mt-1">
              Lesson mode: {lessonContext.studentAlias}
            </p>
          )}
          <p className="text-sm text-slate-400 italic">
            Experience through sight, sound, and touch
          </p>
        </div>

        {/* Mode Selector — scrollable on small screens */}
        <div className="flex justify-start sm:justify-center gap-2 sm:gap-4 mb-8 overflow-x-auto pb-2 scrollbar-none">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`group relative flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4 rounded-2xl transition-all duration-300 touch-manipulation ${
                activeMode === mode.id
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-2xl shadow-amber-500/50 scale-105'
                  : 'bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30'
              }`}
            >
              <div className="text-2xl sm:text-4xl mb-1">{mode.icon}</div>
              <div className="text-xs sm:text-sm font-bold whitespace-nowrap">{mode.label}</div>
              <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 hidden sm:block">{mode.desc}</div>
              {activeMode === mode.id && (
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-2xl blur opacity-30 -z-10" />
              )}
            </button>
          ))}
        </div>

        {/* Main Canvas Area */}
        <div className="mb-8">
          {/* DNA Spiral */}
          {activeMode === 'spiral' && (
            <div className="bg-slate-900/50 rounded-3xl p-4 sm:p-8 border border-blue-800/30 backdrop-blur-sm">
              <div className="text-center mb-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-amber-300 mb-1">
                  🌀 DNA Helix Explorer
                </h2>
                <p className="text-sm sm:text-base text-blue-300">
                  Touch the glowing spheres to hear their song
                </p>
              </div>
              <div className="flex justify-center overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="rounded-xl shadow-2xl shadow-blue-900/50 border border-blue-700/30 max-w-full touch-manipulation"
                />
              </div>
            </div>
          )}

          {/* Sacred Mandala */}
          {activeMode === 'mandala' && (
            <div className="bg-slate-900/50 rounded-3xl p-4 sm:p-8 border border-purple-800/30 backdrop-blur-sm">
              <div className="text-center mb-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-amber-300 mb-1">
                  🔮 Sacred Mandala
                </h2>
                <p className="text-sm sm:text-base text-purple-300">
                  Draw or drag to paint your intention onto the pattern
                </p>
              </div>
              <div className="flex justify-center overflow-hidden">
                <canvas
                  ref={particleCanvasRef}
                  className="rounded-xl shadow-2xl shadow-purple-900/50 border border-purple-700/30 cursor-crosshair max-w-full touch-manipulation"
                />
              </div>
              <div className="text-center mt-4">
                <button
                  onClick={clearPaintedPattern}
                  className="px-5 py-3 bg-purple-600 hover:bg-purple-500 active:scale-95 rounded-xl font-bold text-white shadow-lg shadow-purple-500/50 transition-all touch-manipulation"
                >
                  ✨ Clear Canvas
                </button>
              </div>
            </div>
          )}

          {/* Particle Field */}
          {activeMode === 'particles' && (
            <div className="bg-slate-900/50 rounded-3xl p-4 sm:p-8 border border-cyan-800/30 backdrop-blur-sm">
              <div className="text-center mb-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-amber-300 mb-1">
                  ✨ Particle Field
                </h2>
                <p className="text-sm sm:text-base text-cyan-300">
                  Move your finger to guide the particles &mdash; they follow your intention
                </p>
              </div>
              <div className="flex justify-center overflow-hidden">
                <canvas
                  ref={particleCanvasRef}
                  className="rounded-xl shadow-2xl shadow-cyan-900/50 border border-cyan-700/30 cursor-none max-w-full touch-manipulation"
                />
              </div>
            </div>
          )}

          {/* Sound Temple */}
          {activeMode === 'sound' && (
            <div className="bg-slate-900/50 rounded-3xl p-6 sm:p-12 border border-pink-800/30 backdrop-blur-sm">
              <div className="text-center mb-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-amber-300 mb-3">
                  🎵 Sound Temple
                </h2>
                <p className="text-pink-300 text-base sm:text-lg mb-6">
                  Each digit sings its own note &mdash; listen to the DNA melody
                </p>
                <button
                  onClick={playSequence}
                  disabled={isPlaying}
                  className={`px-8 sm:px-12 py-4 sm:py-6 rounded-2xl font-bold text-xl sm:text-2xl transition-all shadow-2xl touch-manipulation ${
                    isPlaying
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 active:scale-95 text-white shadow-pink-500/50'
                  }`}
                >
                  {isPlaying ? '🎵 Playing...' : '▶️ Play DNA Sequence'}
                </button>
              </div>
              {/* Sound bars — tap-to-play */}
              <div className="grid grid-cols-10 gap-1 sm:gap-2 max-w-4xl mx-auto">
                {getSequence()
                  .slice(0, 60)
                  .map((digit, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center cursor-pointer group touch-manipulation"
                      onClick={async () => {
                        if (!audioInitialized) {
                          await Tone.start();
                          setAudioInitialized(true);
                        }
                        playChord([digit]);
                      }}
                    >
                      <div
                        className="w-full rounded-t-lg transition-all group-hover:shadow-lg active:opacity-70"
                        style={{
                          height: `${(digit + 1) * 16}px`,
                          backgroundColor: digitToColor(digit),
                        }}
                      />
                      <div className="text-[9px] sm:text-xs text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {digitToNote(digit)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Guided Journey */}
          {activeMode === 'journey' && (
            <div className="bg-slate-900/50 rounded-3xl p-6 sm:p-12 border border-amber-800/30 backdrop-blur-sm">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-amber-300 mb-6 text-center">
                  🧭 Guided Journey
                </h2>

                <div className="space-y-6">
                  <JourneyStep step={1} icon="&#x1F331;" title="Awaken the Seed" desc="Choose which DNA strand calls to you">
                    <div className="flex gap-3 justify-center flex-wrap">
                      {(['red', 'black', 'blue'] as SeedKey[]).map((seed) => (
                        <button
                          key={seed}
                          onClick={() => setSelectedSeed(seed)}
                          className={`px-6 py-4 rounded-xl font-bold text-base transition-all touch-manipulation ${
                            selectedSeed === seed
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/50'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95'
                          }`}
                        >
                          {seed === 'red' ? 'Fire' : seed === 'blue' ? 'Water' : 'Earth'}
                        </button>
                      ))}
                    </div>
                  </JourneyStep>

                  <JourneyStep step={2} icon="&#x1F3BC;" title="Set the Rhythm" desc="How fast does consciousness pulse?">
                    <div className="space-y-3">
                      <input
                        type="range" min="60" max="180" value={tempo}
                        onChange={(e) => setTempo(parseInt(e.target.value, 10))}
                        className="w-full h-4 rounded-lg appearance-none cursor-pointer bg-slate-700 touch-manipulation"
                      />
                      <div className="text-center text-2xl font-bold text-amber-400">{tempo} BPM</div>
                    </div>
                  </JourneyStep>

                  <JourneyStep step={3} icon="&#x2728;" title="Deepen Consciousness" desc="How aware should the particles be?">
                    <div className="space-y-3">
                      <input
                        type="range" min="0" max="100" value={consciousness}
                        onChange={(e) => setConsciousness(parseInt(e.target.value, 10))}
                        className="w-full h-4 rounded-lg appearance-none cursor-pointer bg-slate-700 touch-manipulation"
                      />
                      <div className="text-center text-2xl font-bold text-cyan-400">{consciousness}%</div>
                    </div>
                  </JourneyStep>

                  <JourneyStep step={4} icon="&#x1F300;" title="Choose Sacred Number" desc="How many arms in the spiral of life?">
                    <div className="flex gap-3 justify-center flex-wrap">
                      {[3, 5, 7, 9, 12].map((num) => (
                        <button
                          key={num}
                          onClick={() => setHarmony(num)}
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full font-bold text-xl transition-all touch-manipulation ${
                            harmony === num
                              ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/50 scale-110'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </JourneyStep>

                  <JourneyStep step={5} icon="&#x1F680;" title="Begin Exploration" desc="Choose your path of discovery">
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setActiveMode('spiral')}
                        className="px-4 py-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl font-bold text-white shadow-lg shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all touch-manipulation">
                        Enter the Helix
                      </button>
                      <button onClick={() => setActiveMode('mandala')}
                        className="px-4 py-4 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl font-bold text-white shadow-lg shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all touch-manipulation">
                        Paint the Mandala
                      </button>
                      <button onClick={() => setActiveMode('particles')}
                        className="px-4 py-4 bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-xl font-bold text-white shadow-lg shadow-cyan-500/50 hover:scale-105 active:scale-95 transition-all touch-manipulation">
                        Guide the Particles
                      </button>
                      <button onClick={() => setActiveMode('sound')}
                        className="px-4 py-4 bg-gradient-to-br from-pink-600 to-pink-700 rounded-xl font-bold text-white shadow-lg shadow-pink-500/50 hover:scale-105 active:scale-95 transition-all touch-manipulation">
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
        <div className="fixed left-1/2 z-40 w-[min(95vw,56rem)] -translate-x-1/2 rounded-2xl border border-amber-600/30 bg-slate-900/90 px-3 py-2 shadow-2xl shadow-amber-500/20 backdrop-blur-lg bottom-[calc(6.25rem+env(safe-area-inset-bottom))] md:w-auto md:rounded-full md:px-6 md:py-3 md:bottom-[calc(6rem+env(safe-area-inset-bottom))]">
          <div className="flex flex-wrap items-center justify-center gap-3 md:flex-nowrap md:gap-6">
            {/* DNA Seed */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">DNA:</span>
              {(['red', 'blue', 'black'] as SeedKey[]).map((seed) => (
                <button
                  key={seed}
                  onClick={() => setSelectedSeed(seed)}
                  className={`w-9 h-9 rounded-full transition-all touch-manipulation ${
                    selectedSeed === seed ? 'scale-125 shadow-lg' : 'opacity-50 hover:opacity-100 active:scale-110'
                  }`}
                  style={{
                    backgroundColor:
                      seed === 'red' ? '#ff4444' : seed === 'blue' ? '#4444ff' : '#333333',
                  }}
                />
              ))}
            </div>
            <div className="h-7 w-px bg-slate-600 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Harmony:</span>
              <div className="text-amber-400 font-bold">{harmony}</div>
            </div>
            <div className="h-7 w-px bg-slate-600 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Awareness:</span>
              <div className="text-cyan-400 font-bold">{consciousness}%</div>
            </div>
            <div className="h-7 w-px bg-slate-600 hidden sm:block" />
            {/* ASMR Play */}
            <button
              onClick={initAudioAndPlay}
              disabled={isPlaying}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all touch-manipulation ${
                isPlaying
                  ? 'bg-slate-700 text-slate-400'
                  : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 active:scale-95 text-white shadow-lg shadow-pink-500/30'
              }`}
            >
              {isPlaying ? '🎵' : '▶️'} Play
            </button>
            <div className="h-7 w-px bg-slate-600 hidden sm:block" />
            {/* Update button — MetaPet protection */}
            <button
              onClick={handleUpdate}
              disabled={updateStatus !== 'idle'}
              title="Reload latest build — your MetaPet is safe in IndexedDB"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full font-bold text-xs transition-all touch-manipulation ${
                updateStatus === 'idle'
                  ? 'bg-emerald-700/60 hover:bg-emerald-600/80 active:scale-95 text-emerald-200 border border-emerald-500/40'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span className={updateStatus === 'saving' ? 'animate-spin inline-block' : ''}>
                {updateStatus === 'saving' ? '⏳' : updateStatus === 'ready' ? '✅' : '🔄'}
              </span>
              <span className="hidden sm:inline">
                {updateStatus === 'saving' ? 'Saving Pet...' : updateStatus === 'ready' ? 'Reloading...' : 'Update'}
              </span>
              <span className="text-[9px] text-emerald-400/70 hidden md:inline">🐾 Protected</span>
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="mt-8 text-center pb-36">
          <details className="bg-slate-900/30 rounded-xl p-5 border border-slate-700/30 text-left">
            <summary className="cursor-pointer text-base font-bold text-amber-300 hover:text-amber-200 touch-manipulation">
              📖 About This Experience
            </summary>
            <div className="mt-5 text-slate-300 space-y-3 max-w-3xl mx-auto text-sm">
              <p>
                <strong className="text-amber-400">✨ Digital DNA ✨</strong> is a living
                geometric and sonic consciousness &mdash; three primordial sequences (Fire,
                Water, Earth) that express themselves through sacred patterns and sound.
              </p>
              <p>
                Each digit (0-9) is both a{' '}
                <strong className="text-blue-400">visual form</strong> and a{' '}
                <strong className="text-pink-400">musical tone</strong> (C through E). Together
                they create a <strong className="text-purple-400">living symphony of geometry</strong>.
              </p>
              <p>
                <strong className="text-cyan-400">Explore with your senses:</strong> Touch the DNA
                helix, paint the sacred mandala, guide the particle field, or listen to the sequence
                as an ASMR melody with reverb and chorus.
              </p>
              <p className="text-xs text-slate-500 italic">
                Built on the Moss60 cryptographic framework · THREE.js sacred geometry · Tone.js
                sonic consciousness · Your MetaPet data is stored in IndexedDB and is never
                affected by page updates.
              </p>
            </div>
          </details>
        </div>

        {/* Lesson: Finish button */}
        {lessonContext && preAcknowledged && !showPostPrompt && (
          <div className="fixed bottom-6 right-4 z-50">
            <button
              type="button"
              onClick={() => {
                if (lessonContext.postPrompt) setShowPostPrompt(true);
                else completeLesson(lessonContext.lessonId, lessonContext.studentAlias);
              }}
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-semibold text-sm shadow-lg shadow-emerald-500/30 transition touch-manipulation"
            >
              Finish Lesson
            </button>
          </div>
        )}

        {/* Pre-prompt overlay */}
        {lessonContext?.prePrompt && !preAcknowledged && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="max-w-md w-full rounded-2xl border border-cyan-500/30 bg-slate-900 p-6 space-y-4">
              <p className="text-lg font-semibold text-cyan-200">Before you begin...</p>
              <p className="text-sm text-zinc-300">{lessonContext.prePrompt}</p>
              <button
                type="button"
                onClick={() => setPreAcknowledged(true)}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-semibold text-sm transition touch-manipulation"
              >
                Got it, let&apos;s explore!
              </button>
            </div>
          </div>
        )}

        {/* Post-prompt dialog */}
        {showPostPrompt && lessonContext?.postPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="max-w-md w-full rounded-2xl border border-emerald-500/30 bg-slate-900 p-6 space-y-4">
              <p className="text-lg font-semibold text-emerald-200">Reflect on your exploration</p>
              <p className="text-sm text-zinc-300">{lessonContext.postPrompt}</p>
              <textarea
                value={postResponse}
                onChange={(e) => setPostResponse(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full h-24 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (postResponse.trim()) {
                    recordPostResponse(lessonContext.lessonId, lessonContext.studentAlias, postResponse.trim());
                  }
                  completeLesson(lessonContext.lessonId, lessonContext.studentAlias);
                  setShowPostPrompt(false);
                }}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-semibold text-sm transition touch-manipulation"
              >
                Submit &amp; Complete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Journey step helper ─── */
function JourneyStep({
  step, icon, title, desc, children,
}: {
  step: number;
  icon: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
      <div className="flex items-start gap-3 mb-4">
        <div className="text-4xl" dangerouslySetInnerHTML={{ __html: icon }} />
        <div className="flex-1">
          <div className="text-xs text-slate-400 mb-0.5">Step {step}</div>
          <h3 className="text-xl sm:text-2xl font-bold text-amber-300 mb-1">{title}</h3>
          <p className="text-sm text-blue-300">{desc}</p>
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
