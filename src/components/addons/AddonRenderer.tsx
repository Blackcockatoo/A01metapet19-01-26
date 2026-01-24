/**
 * AddonRenderer - Renders equipped addons on Auralia
 */

'use client';

import React, { useMemo } from 'react';
import type { Addon } from '@/lib/addons';

interface AddonRendererProps {
  addon: Addon;
  petSize?: number;
  petPosition?: { x: number; y: number };
  animationPhase?: number;
}

export const AddonRenderer: React.FC<AddonRendererProps> = ({
  addon,
  petSize = 100,
  petPosition = { x: 0, y: 0 },
  animationPhase = 0,
}) => {
  const { attachment, visual } = addon;

  // Calculate position based on attachment point
  const position = useMemo(() => {
    const baseX = petPosition.x;
    const baseY = petPosition.y;

    let anchorX = baseX;
    let anchorY = baseY;

    // Adjust anchor based on attachment point
    switch (attachment.anchorPoint) {
      case 'head':
        anchorY = baseY - petSize * 0.4;
        break;
      case 'body':
        anchorY = baseY;
        break;
      case 'left-hand':
        anchorX = baseX - petSize * 0.3;
        anchorY = baseY + petSize * 0.2;
        break;
      case 'right-hand':
        anchorX = baseX + petSize * 0.3;
        anchorY = baseY + petSize * 0.2;
        break;
      case 'back':
        anchorY = baseY + petSize * 0.1;
        break;
      case 'floating':
      case 'aura':
        // Use offset directly
        break;
    }

    return {
      x: anchorX + attachment.offset.x,
      y: anchorY + attachment.offset.y,
    };
  }, [petPosition, petSize, attachment]);

  // Animation transform
  const animationTransform = useMemo(() => {
    if (!visual.animation) return '';

    const { type, duration } = visual.animation;
    const progress = (animationPhase % duration) / duration;

    switch (type) {
      case 'float':
        const floatY = Math.sin(progress * Math.PI * 2) * 3;
        return `translateY(${floatY}px)`;

      case 'rotate':
        const rotateDeg = progress * 360;
        return `rotate(${rotateDeg}deg)`;

      case 'pulse':
        const scale = 1 + Math.sin(progress * Math.PI * 2) * 0.1;
        return `scale(${scale})`;

      case 'shimmer':
        // Handled via opacity animation
        return '';

      default:
        return '';
    }
  }, [visual.animation, animationPhase]);

  // Opacity for shimmer effect
  const opacity = useMemo(() => {
    if (visual.animation?.type === 'shimmer') {
      const progress =
        (animationPhase % visual.animation.duration) / visual.animation.duration;
      return 0.7 + Math.sin(progress * Math.PI * 2) * 0.3;
    }
    return 1;
  }, [visual.animation, animationPhase]);

  return (
    <g
      transform={`translate(${position.x}, ${position.y}) rotate(${attachment.rotation}) scale(${attachment.scale})`}
      opacity={opacity}
    >
      {/* Main addon visual */}
      {visual.svgPath && (
        <g transform={animationTransform}>
          <path
            d={visual.svgPath}
            fill={visual.colors.primary}
            stroke={visual.colors.secondary || visual.colors.primary}
            strokeWidth="1"
          />

          {/* Glow effect */}
          {visual.colors.glow && (
            <path
              d={visual.svgPath}
              fill="none"
              stroke={visual.colors.glow}
              strokeWidth="3"
              filter="url(#addonGlow)"
              opacity="0.6"
            />
          )}

          {/* Accent highlights */}
          {visual.colors.accent && (
            <path
              d={visual.svgPath}
              fill="none"
              stroke={visual.colors.accent}
              strokeWidth="0.5"
              opacity="0.8"
            />
          )}
        </g>
      )}

      {/* Particles */}
      {visual.particles && (
        <AddonParticles
          config={visual.particles}
          animationPhase={animationPhase}
          centerX={0}
          centerY={0}
        />
      )}
    </g>
  );
};

interface AddonParticlesProps {
  config: NonNullable<Addon['visual']['particles']>;
  animationPhase: number;
  centerX: number;
  centerY: number;
}

const AddonParticles: React.FC<AddonParticlesProps> = ({
  config,
  animationPhase,
  centerX,
  centerY,
}) => {
  const particles = useMemo(() => {
    const { count, color, size, behavior } = config;
    const result: Array<{ id: number; x: number; y: number; opacity: number }> = [];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      let x = centerX;
      let y = centerY;

      switch (behavior) {
        case 'orbit':
          const radius = 30 + Math.sin((animationPhase / 1000 + i) * 0.5) * 5;
          const orbitAngle = angle + animationPhase / 1000;
          x = centerX + Math.cos(orbitAngle) * radius;
          y = centerY + Math.sin(orbitAngle) * radius;
          break;

        case 'ambient':
          x =
            centerX +
            Math.sin((animationPhase / 2000 + i) * 0.8) * 20;
          y =
            centerY +
            Math.cos((animationPhase / 1500 + i) * 0.6) * 20;
          break;

        case 'trail':
          x = centerX + Math.cos(angle) * (20 - i * 2);
          y = centerY + Math.sin(angle) * (20 - i * 2) - animationPhase / 100;
          break;

        case 'burst':
          const burstRadius = ((animationPhase % 2000) / 2000) * 30;
          x = centerX + Math.cos(angle) * burstRadius;
          y = centerY + Math.sin(angle) * burstRadius;
          break;
      }

      result.push({
        id: i,
        x,
        y,
        opacity: behavior === 'burst' ? 1 - (animationPhase % 2000) / 2000 : 0.8,
      });
    }

    return result;
  }, [config, animationPhase, centerX, centerY]);

  return (
    <>
      {particles.map((p) => (
        <circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r={config.size}
          fill={config.color}
          opacity={p.opacity}
          filter="url(#particleGlow)"
        />
      ))}
    </>
  );
};

/**
 * Addon SVG filters and definitions
 */
export const AddonSVGDefs: React.FC = () => (
  <defs>
    <filter id="addonGlow">
      <feGaussianBlur stdDeviation="2" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="particleGlow">
      <feGaussianBlur stdDeviation="1" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);
