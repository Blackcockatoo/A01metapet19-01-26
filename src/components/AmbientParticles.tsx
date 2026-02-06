'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useStore } from '@/lib/store';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
}

/**
 * Ambient floating particles that respond to pet mood
 * Creates a magical, living atmosphere
 */
export function AmbientParticles({ enabled = true }: { enabled?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  const vitals = useStore(state => state.vitals);

  // Calculate mood-based colors and particle behavior
  const moodConfig = useMemo(() => {
    const avgVitals = (vitals.hunger + vitals.hygiene + vitals.mood + vitals.energy) / 4;

    // Different particle colors based on dominant vital state
    if (avgVitals >= 70) {
      // Happy - soft cyan/emerald particles
      return {
        colors: ['rgba(34, 211, 238, 0.6)', 'rgba(52, 211, 153, 0.5)', 'rgba(192, 132, 252, 0.4)'],
        spawnRate: 0.08,
        speed: 0.5,
        floatStrength: 1.2,
      };
    } else if (vitals.energy < 30) {
      // Tired - slow, dim particles
      return {
        colors: ['rgba(99, 102, 241, 0.3)', 'rgba(139, 92, 246, 0.2)'],
        spawnRate: 0.03,
        speed: 0.2,
        floatStrength: 0.5,
      };
    } else if (vitals.hunger < 30) {
      // Hungry - warm orange particles
      return {
        colors: ['rgba(251, 146, 60, 0.5)', 'rgba(251, 191, 36, 0.4)'],
        spawnRate: 0.05,
        speed: 0.4,
        floatStrength: 0.8,
      };
    } else if (avgVitals < 40) {
      // Sad - minimal, gray particles
      return {
        colors: ['rgba(148, 163, 184, 0.2)'],
        spawnRate: 0.02,
        speed: 0.15,
        floatStrength: 0.3,
      };
    }

    // Neutral - purple particles
    return {
      colors: ['rgba(139, 92, 246, 0.4)', 'rgba(192, 132, 252, 0.3)', 'rgba(34, 211, 238, 0.3)'],
      spawnRate: 0.05,
      speed: 0.35,
      floatStrength: 1,
    };
  }, [vitals]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const spawnParticle = () => {
      const colors = moodConfig.colors;
      const particle: Particle = {
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        vx: (Math.random() - 0.5) * moodConfig.speed,
        vy: -Math.random() * moodConfig.speed - 0.3,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: 200 + Math.random() * 100,
      };
      particlesRef.current.push(particle);
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new particles based on mood
      if (Math.random() < moodConfig.spawnRate && particlesRef.current.length < 50) {
        spawnParticle();
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.life++;

        // Float upward with slight wave motion
        p.x += p.vx + Math.sin(p.life * 0.02) * 0.3 * moodConfig.floatStrength;
        p.y += p.vy;

        // Fade based on life
        const lifeRatio = p.life / p.maxLife;
        const currentOpacity = p.opacity * (1 - lifeRatio);

        // Draw particle with glow
        ctx.save();
        ctx.globalAlpha = currentOpacity;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Remove if too old or off screen
        return p.life < p.maxLife && p.y > -20;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [moodConfig, enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
}
