'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import * as Tone from 'tone';

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

export default function DigitalDNAHub() {
  const [activeMode, setActiveMode] = useState<ModeKey>('spiral');
  const [selectedSeed, setSelectedSeed] = useState<SeedKey>('red');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [consciousness, setConsciousness] = useState(50);
  const [harmony, setHarmony] = useState(7);
  const [tempo, setTempo] = useState(120);
  const [paintedPattern, setPaintedPattern] = useState<PaintPoint[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, down: false });

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

  // Initialise synth once
  useEffect(() => {
    if (typeof window === 'undefined' || synthRef.current) return;
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 1 },
    }).toDestination();

    const reverb = new Tone.Reverb({ decay: 4, wet: 0.3 }).toDestination();
    synth.connect(reverb);
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
      const duration = interval * 0.8;
      synthRef.current?.triggerAttackRelease(note, duration, time);
    });

    setTimeout(
      () => setIsPlaying(false),
      sequence.slice(0, 60).length * interval * 1000,
    );
  }, [audioInitialized, getSequence, tempo]);

  // 3D Spiral visualisation
  useEffect(() => {
    if (!canvasRef.current || activeMode !== 'spiral') return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);

    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(800, 600);

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

    const onMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
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
          setTimeout(() => {
            if (obj.material) obj.material.emissiveIntensity = 0.5;
          }, 200);
        }
      }
    };
    canvas.addEventListener('mousemove', onMouseMove);

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
      renderer.dispose();
    };
  }, [activeMode, selectedSeed, harmony, audioInitialized, getSequence, playChord]);

  // Mandala mode
  useEffect(() => {
    if (!particleCanvasRef.current || activeMode !== 'mandala') return;

    const canvas = particleCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = (canvas.width = 800);
    const H = (canvas.height = 800);
    const cx = W / 2;
    const cy = H / 2;

    const sequence = getSequence();
    const segments = harmony * 12;

    const drawMandala = () => {
      ctx.fillStyle = '#0a0e27';
      ctx.fillRect(0, 0, W, H);

      for (let ring = 0; ring < 7; ring++) {
        const radius = (ring + 1) * 50;
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
        ctx.moveTo(cx + Math.cos(a1) * 80, cy + Math.sin(a1) * 80);
        ctx.lineTo(cx + Math.cos(a2) * 80, cy + Math.sin(a2) * 80);
        ctx.stroke();
      }

      paintedPattern.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.fill();
      });
    };

    const onDown = () => { mouseRef.current.down = true; };
    const onUp = () => { mouseRef.current.down = false; };
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseRef.current.x = x;
      mouseRef.current.y = y;
      if (mouseRef.current.down) {
        setPaintedPattern((prev) => [...prev, { x, y }]);
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        const digit = Math.floor((dist / 50) % 10);
        if (audioInitialized) playChord([digit]);
      }
    };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mousemove', onMove);

    let animId: number;
    const loop = () => { animId = requestAnimationFrame(loop); drawMandala(); };
    loop();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('mousemove', onMove);
    };
  }, [activeMode, selectedSeed, harmony, paintedPattern, audioInitialized, getSequence, playChord]);

  // Particle field mode
  useEffect(() => {
    if (!particleCanvasRef.current || activeMode !== 'particles') return;

    const canvas = particleCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = (canvas.width = 800);
    const H = (canvas.height = 800);

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

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };
    canvas.addEventListener('mousemove', onMove);

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
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.vy *= 0.99;
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
          const d = Math.sqrt(
            (pts[i].x - pts[j].x) ** 2 + (pts[i].y - pts[j].y) ** 2,
          );
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
    };
  }, [activeMode, selectedSeed, consciousness, getSequence]);

  const initAudioAndPlay = async () => {
    if (!audioInitialized) {
      await Tone.start();
      setAudioInitialized(true);
    }
    playSequence();
  };

  const modes: { id: ModeKey; icon: string; label: string; desc: string }[] = [
    { id: 'spiral', icon: '\u{1F300}', label: 'DNA Helix', desc: 'Touch the spheres' },
    { id: 'mandala', icon: '\u{1F52E}', label: 'Sacred Mandala', desc: 'Paint your pattern' },
    { id: 'particles', icon: '\u2728', label: 'Particle Field', desc: 'Guide with your hand' },
    { id: 'sound', icon: '\u{1F3B5}', label: 'Sound Temple', desc: 'Hear the sequence' },
    { id: 'journey', icon: '\u{1F9ED}', label: 'Guided Journey', desc: 'Follow the path' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-amber-50">
      {/* Cosmic Background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400 bg-clip-text text-transparent animate-pulse">
            Digital DNA
          </h1>
          <p className="text-2xl text-blue-300 font-light mb-2">
            Sacred Geometry &amp; Sonic Consciousness
          </p>
          <p className="text-sm text-slate-400 italic">
            Experience through sight, sound, and touch
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`group relative px-6 py-4 rounded-2xl transition-all duration-300 ${
                activeMode === mode.id
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-2xl shadow-amber-500/50 scale-110'
                  : 'bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30'
              }`}
            >
              <div className="text-4xl mb-2">{mode.icon}</div>
              <div className="text-sm font-bold">{mode.label}</div>
              <div className="text-xs text-slate-400 mt-1">{mode.desc}</div>
              {activeMode === mode.id && (
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-2xl blur opacity-30 -z-10" />
              )}
            </button>
          ))}
        </div>

        {/* Main Canvas Area */}
        <div className="mb-12">
          {/* DNA Spiral */}
          {activeMode === 'spiral' && (
            <div className="bg-slate-900/50 rounded-3xl p-8 border border-blue-800/30 backdrop-blur-sm">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-amber-300 mb-2">
                  DNA Helix Explorer
                </h2>
                <p className="text-blue-300">
                  Move your cursor over the glowing spheres to hear their song
                </p>
              </div>
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  className="rounded-xl shadow-2xl shadow-blue-900/50 border border-blue-700/30"
                />
              </div>
            </div>
          )}

          {/* Sacred Mandala */}
          {activeMode === 'mandala' && (
            <div className="bg-slate-900/50 rounded-3xl p-8 border border-purple-800/30 backdrop-blur-sm">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-amber-300 mb-2">
                  Sacred Mandala
                </h2>
                <p className="text-purple-300">
                  Click and drag to paint your intention onto the pattern
                </p>
              </div>
              <div className="flex justify-center">
                <canvas
                  ref={particleCanvasRef}
                  className="rounded-xl shadow-2xl shadow-purple-900/50 border border-purple-700/30 cursor-crosshair"
                />
              </div>
              <div className="text-center mt-6">
                <button
                  onClick={() => setPaintedPattern([])}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-white shadow-lg shadow-purple-500/50 transition-all"
                >
                  Clear Canvas
                </button>
              </div>
            </div>
          )}

          {/* Particle Field */}
          {activeMode === 'particles' && (
            <div className="bg-slate-900/50 rounded-3xl p-8 border border-cyan-800/30 backdrop-blur-sm">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-amber-300 mb-2">
                  Particle Field
                </h2>
                <p className="text-cyan-300">
                  Move your hand to guide the particles &mdash; they follow your intention
                </p>
              </div>
              <div className="flex justify-center">
                <canvas
                  ref={particleCanvasRef}
                  className="rounded-xl shadow-2xl shadow-cyan-900/50 border border-cyan-700/30 cursor-none"
                />
              </div>
            </div>
          )}

          {/* Sound Temple */}
          {activeMode === 'sound' && (
            <div className="bg-slate-900/50 rounded-3xl p-12 border border-pink-800/30 backdrop-blur-sm">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-amber-300 mb-4">
                  Sound Temple
                </h2>
                <p className="text-pink-300 text-lg mb-8">
                  Each digit sings its own note &mdash; listen to the DNA melody
                </p>
                <button
                  onClick={playSequence}
                  disabled={isPlaying}
                  className={`px-12 py-6 rounded-2xl font-bold text-2xl transition-all shadow-2xl ${
                    isPlaying
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-pink-500/50 transform hover:scale-105'
                  }`}
                >
                  {isPlaying ? 'Playing...' : 'Play DNA Sequence'}
                </button>
              </div>
              {/* Sound bars */}
              <div className="grid grid-cols-10 gap-2 max-w-4xl mx-auto">
                {getSequence()
                  .slice(0, 60)
                  .map((digit, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center cursor-pointer group"
                      onClick={async () => {
                        if (!audioInitialized) {
                          await Tone.start();
                          setAudioInitialized(true);
                        }
                        playChord([digit]);
                      }}
                    >
                      <div
                        className="w-full rounded-t-lg transition-all group-hover:shadow-lg"
                        style={{
                          height: `${(digit + 1) * 20}px`,
                          backgroundColor: digitToColor(digit),
                        }}
                      />
                      <div className="text-xs text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {digitToNote(digit)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Guided Journey */}
          {activeMode === 'journey' && (
            <div className="bg-slate-900/50 rounded-3xl p-12 border border-amber-800/30 backdrop-blur-sm">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-4xl font-bold text-amber-300 mb-8 text-center">
                  Guided Journey
                </h2>

                <div className="space-y-8">
                  {/* Step 1 */}
                  <JourneyStep step={1} icon="&#x1F331;" title="Awaken the Seed" desc="Choose which DNA strand calls to you">
                    <div className="flex gap-4 justify-center">
                      {(['red', 'black', 'blue'] as SeedKey[]).map((seed) => (
                        <button
                          key={seed}
                          onClick={() => setSelectedSeed(seed)}
                          className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                            selectedSeed === seed
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/50'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {seed === 'red' ? 'Fire' : seed === 'blue' ? 'Water' : 'Earth'}
                        </button>
                      ))}
                    </div>
                  </JourneyStep>

                  {/* Step 2 */}
                  <JourneyStep step={2} icon="&#x1F3BC;" title="Set the Rhythm" desc="How fast does consciousness pulse?">
                    <div className="space-y-3">
                      <input
                        type="range"
                        min="60"
                        max="180"
                        value={tempo}
                        onChange={(e) => setTempo(parseInt(e.target.value, 10))}
                        className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-slate-700"
                      />
                      <div className="text-center text-2xl font-bold text-amber-400">
                        {tempo} BPM
                      </div>
                    </div>
                  </JourneyStep>

                  {/* Step 3 */}
                  <JourneyStep step={3} icon="&#x2728;" title="Deepen Consciousness" desc="How aware should the particles be?">
                    <div className="space-y-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={consciousness}
                        onChange={(e) => setConsciousness(parseInt(e.target.value, 10))}
                        className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-slate-700"
                      />
                      <div className="text-center text-2xl font-bold text-cyan-400">
                        {consciousness}%
                      </div>
                    </div>
                  </JourneyStep>

                  {/* Step 4 */}
                  <JourneyStep step={4} icon="&#x1F300;" title="Choose Sacred Number" desc="How many arms in the spiral of life?">
                    <div className="flex gap-3 justify-center">
                      {[3, 5, 7, 9, 12].map((num) => (
                        <button
                          key={num}
                          onClick={() => setHarmony(num)}
                          className={`w-16 h-16 rounded-full font-bold text-xl transition-all ${
                            harmony === num
                              ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/50 scale-110'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </JourneyStep>

                  {/* Step 5 */}
                  <JourneyStep step={5} icon="&#x1F680;" title="Begin Exploration" desc="Choose your path of discovery">
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setActiveMode('spiral')}
                        className="px-6 py-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl font-bold text-white shadow-lg shadow-blue-500/50 hover:scale-105 transition-all"
                      >
                        Enter the Helix
                      </button>
                      <button
                        onClick={() => setActiveMode('mandala')}
                        className="px-6 py-4 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl font-bold text-white shadow-lg shadow-purple-500/50 hover:scale-105 transition-all"
                      >
                        Paint the Mandala
                      </button>
                      <button
                        onClick={() => setActiveMode('particles')}
                        className="px-6 py-4 bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-xl font-bold text-white shadow-lg shadow-cyan-500/50 hover:scale-105 transition-all"
                      >
                        Guide the Particles
                      </button>
                      <button
                        onClick={() => setActiveMode('sound')}
                        className="px-6 py-4 bg-gradient-to-br from-pink-600 to-pink-700 rounded-xl font-bold text-white shadow-lg shadow-pink-500/50 hover:scale-105 transition-all"
                      >
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
                <button
                  key={seed}
                  onClick={() => setSelectedSeed(seed)}
                  className={`w-10 h-10 rounded-full transition-all ${
                    selectedSeed === seed ? 'scale-125 shadow-lg' : 'opacity-50 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor:
                      seed === 'red' ? '#ff4444' : seed === 'blue' ? '#4444ff' : '#333333',
                  }}
                />
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
            <button
              onClick={initAudioAndPlay}
              disabled={isPlaying}
              className={`px-6 py-2 rounded-full font-bold transition-all ${
                isPlaying
                  ? 'bg-slate-700 text-slate-400'
                  : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg shadow-pink-500/30'
              }`}
            >
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
                layer, THREE.js for sacred geometry, and Tone.js for sonic consciousness.
              </p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

/* ─── tiny helper component ─── */
function JourneyStep({
  step,
  icon,
  title,
  desc,
  children,
}: {
  step: number;
  icon: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
      <div className="flex items-start gap-4 mb-4">
        <div className="text-5xl" dangerouslySetInnerHTML={{ __html: icon }} />
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
