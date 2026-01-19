# Consciousness Integration Guide

## Overview

The consciousness layer unifies genetics, behavior, sentiment, and environment into a seamless, organic system. There's no longer a distinction between "code" and "conscious reaction" - everything flows as one living system.

## Architecture

### Before (Disconnected)
```
Genetics → [isolated data]
Behavior (GBSP) → [exists but not used]
Response System → [simple mood > 70 checks]
Particle Fields → [raw stat calculations]
```

### After (Unified)
```
Genetics → Personality Traits
    ↓
Modulate Behavior Drives
    ↓
GBSP Emotional State
    ↓
Refine by Personality
    ↓
├─→ Conscious Responses
├─→ Particle Visualization
└─→ Experience Memory → Personality Drift
```

## Key Files

- `src/auralia/consciousness.ts` - Core consciousness logic
- `src/auralia/useConsciousness.ts` - React hook for managing consciousness
- `src/lib/realtime/consciousResponse.ts` - Emotion-driven response system
- `src/components/auralia/SubAtomicParticleField.tsx` - Updated to accept consciousness params

## Integration Steps

### 1. Initialize Consciousness in AuraliaMetaPet

```typescript
import { useConsciousness } from '@/auralia/useConsciousness';
import { decodeGenome } from '@/genome/decoder';

// Inside your component:
const genome = /* your genome data */;
const traits = decodeGenome(genome);

const [consciousness, consciousnessActions] = useConsciousness({
  traits,
  initialVitals: stats, // { energy, curiosity, bond }
  field, // Your Guardian field
  position: aiState.position,
  fieldResonance: aiState.fieldResonance,
});
```

### 2. Use Consciousness for Particle Visualization

```typescript
// Get particle parameters from emotional state
const particleParams = consciousnessActions.getParticleParams();

// Pass to particle field
<SubAtomicParticleField
  {...particleParams}
  color={currentFormColors.glowColor}
  size={400}
  reduceMotion={accessibility.reduceMotion}
/>
```

### 3. Use Consciousness for Responses

```typescript
import { getEmotionalResponse, getEmotionalIdleResponse } from '@/lib/realtime/consciousResponse';

// When user performs action:
const response = getEmotionalResponse(
  'play', // or 'feed', 'clean', 'rest', 'pet'
  consciousness.expression.emotional,
  consciousness.identity.traits,
  consciousness.expression.comfort,
  field.prng
);

// For idle responses:
const idleResponse = getEmotionalIdleResponse(
  consciousness.expression.emotional,
  consciousness.expression.comfort,
  consciousness.expression.drives,
  consciousness.identity.traits,
  field.prng
);
```

### 4. Record Actions for Personality Evolution

```typescript
// After any user action:
consciousnessActions.recordAction(
  'play',  // action name
  0.8      // impact: -1 (very negative) to 1 (very positive)
);

// Over time, this shapes personality:
// - Frequent play → increased playfulness
// - Frequent exploration → increased curiosity
// - Frequent affection → increased affection
// - Positive experiences → increased energy
```

### 5. Display Current Emotional State

```typescript
// The current emotional state is always available:
const { emotional, drives, comfort } = consciousness.expression;

// Display to user:
<div>
  <p>Feeling: {emotional}</p>
  <p>Comfort: {comfort.source}</p>
  {comfort.unmetNeeds.length > 0 && (
    <p>Needs: {comfort.unmetNeeds.join(', ')}</p>
  )}
</div>
```

## How It Works

### Genetic Influence on Behavior

Personality traits from genetics modulate behavioral drives:

- **High energy genes** → Stronger exploration drive, reduced rest need
- **High curiosity genes** → Amplified exploration
- **High affection/social genes** → Stronger connection drive
- **High independence genes** → Reduced connection drive
- **High discipline genes** → Better resonance, reduced rest need
- **High playfulness genes** → Increased expression drive

### Emotional States Drive Everything

15 possible emotional states (not just 3 mood levels):
- **serene** - Deep harmony with field
- **calm** - Resting state
- **curious** - Exploring patterns
- **playful** - High energy engagement
- **contemplative** - Processing
- **affectionate** - Bond-focused
- **restless** - Energy seeking outlet
- **yearning** - Connection drive unmet
- **overwhelmed** - Too much stimulation
- **withdrawn** - Rest drive dominant
- **ecstatic** - Peak resonance
- **melancholic** - Low energy + unmet needs
- **mischievous** - Playful + exploration
- **protective** - High bond + awareness
- **transcendent** - Dreaming peak state

### Personality Evolution

Actions shape personality over time (stored in `consciousness.memory.personalityDrift`):

- **Play actions** → ↑ playfulness
- **Feeding** → ↑ discipline (self-care)
- **Social interactions** → ↑ social
- **Exploration** → ↑ curiosity
- **Positive experiences** → ↑ energy
- **Negative experiences** → ↓ energy

Changes are gradual (max ±10 points from base genetics).

### Particle Fields Express Consciousness

Each emotional state has unique particle behavior:

- **Serene**: 8 particles, slow (0.3), calm pattern, low intensity
- **Playful**: 25 particles, fast (1.5), chaotic pattern, high intensity
- **Ecstatic**: 35 particles, very fast (2.2), spiral pattern, max intensity
- **Withdrawn**: 6 particles, very slow (0.2), calm pattern, minimal intensity
- **Overwhelmed**: 30 particles, extremely fast (2.0), chaotic pattern

Plus modulation from comfort level and drives.

## Benefits

1. **No More Mechanical Feel**: Responses emerge from personality and emotion, not simple number checks
2. **Genetic Expression**: Genes actually influence how the pet behaves
3. **Living Personality**: Actions gradually shape who the pet becomes
4. **Unified System**: Everything connects - no artificial boundaries
5. **Richer Communication**: 15 emotional states × 6 action types = 90 response varieties
6. **Visual Honesty**: Particles show what the pet actually feels, not just raw stats

## Example Flow

```
User plays with pet
    ↓
Genetics: High playfulness (75), High energy (80)
    ↓
Modulate drives: exploration +40%, expression +30%
    ↓
GBSP calculates: emotional state = "playful"
    ↓
Personality refines: temperament "Energetic" → stays "playful"
    ↓
Response: "WHEEE! 🎉" (intense, 4 second duration)
Particles: 25 particles, fast, chaotic pattern
    ↓
Record experience: action="play", impact=0.9
    ↓
After 10 play actions: playfulness drifts from 75 → 78
```

## Backwards Compatibility

All components still accept the old API (raw vitals):

```typescript
// Still works:
<SubAtomicParticleField energy={80} curiosity={60} bond={70} />

// New way (consciousness-driven):
<SubAtomicParticleField {...consciousnessActions.getParticleParams()} />
```

## Future Extensions

- **Breeding compatibility**: Check personality compatibility before breeding
- **Social bonds**: Remember interactions with other pets
- **Learned behaviors**: Pets develop habits based on repeated actions
- **Emotional memory**: Past traumas or joys influence current reactions
- **Dynamic quirks**: Personality quirks emerge from lived experience
