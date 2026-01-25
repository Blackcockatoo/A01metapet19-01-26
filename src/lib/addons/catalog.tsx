/**
 * Addon Catalog - Predefined addon templates
 *
 * These are the base definitions for addons. Actual instances will be minted
 * with crypto signatures tied to specific owners.
 */

import type { Addon, AddonCategory, AddonRarity, AddonAttachment, AddonVisual } from './types';

export interface AddonTemplate {
  id: string;
  name: string;
  description: string;
  category: AddonCategory;
  rarity: AddonRarity;
  attachment: AddonAttachment;
  visual: AddonVisual;
  modifiers?: {
    energy?: number;
    curiosity?: number;
    bond?: number;
    luck?: number;
  };
  metadata: {
    creator: string;
    tags?: string[];
    maxEditions?: number;
  };
}

/**
 * Wizard Hat - Epic headwear addon
 */
export const WIZARD_HAT: AddonTemplate = {
  id: 'wizard-hat-001',
  name: 'Mystical Wizard Hat',
  description:
    'A legendary pointed hat imbued with ancient wisdom. Grants increased curiosity and bond with mystical energies.',
  category: 'headwear',
  rarity: 'epic',
  attachment: {
    anchorPoint: 'head',
    offset: { x: 0, y: -25, z: 0 },
    scale: 1.2,
    rotation: 0,
    followAnimation: true,
  },
  visual: {
    svgPath: `
      M 50 10
      L 35 50
      L 10 50
      L 15 55
      L 85 55
      L 90 50
      L 65 50
      Z
    `,
    colors: {
      primary: '#2D1B69', // Deep purple
      secondary: '#4A2F8A', // Medium purple
      accent: '#FFD700', // Gold
      glow: 'rgba(138, 43, 226, 0.4)', // Purple glow
    },
    animation: {
      type: 'float',
      duration: 3000,
      easing: 'ease-in-out',
    },
    particles: {
      count: 8,
      color: '#FFD700',
      size: 2,
      behavior: 'ambient',
    },
  },
  modifiers: {
    curiosity: 15,
    bond: 10,
  },
  metadata: {
    creator: 'Auralia Workshop',
    tags: ['magic', 'wisdom', 'mystical', 'headwear'],
    maxEditions: 100,
  },
};

/**
 * Wizard Staff - Legendary weapon addon
 */
export const WIZARD_STAFF: AddonTemplate = {
  id: 'wizard-staff-001',
  name: 'Staff of Eternal Wisdom',
  description:
    'A powerful staff carved from ancient wood and topped with a glowing crystal. Channels mystical energies and enhances all stats.',
  category: 'weapon',
  rarity: 'legendary',
  attachment: {
    anchorPoint: 'right-hand',
    offset: { x: 15, y: 10, z: 0 },
    scale: 1.5,
    rotation: -30,
    followAnimation: true,
  },
  visual: {
    svgPath: `
      M 48 5 L 52 5 L 52 85 L 48 85 Z
      M 50 2 A 5 5 0 1 1 50 8 A 5 5 0 1 1 50 2
    `,
    colors: {
      primary: '#4A2F1A', // Dark wood
      secondary: '#8B4513', // Medium wood
      accent: '#00FFFF', // Cyan crystal
      glow: 'rgba(0, 255, 255, 0.6)', // Cyan glow
    },
    animation: {
      type: 'glow',
      duration: 2000,
      easing: 'ease-in-out',
    },
    particles: {
      count: 12,
      color: '#00FFFF',
      size: 3,
      behavior: 'orbit',
    },
  },
  modifiers: {
    energy: 20,
    curiosity: 20,
    bond: 15,
    luck: 10,
  },
  metadata: {
    creator: 'Auralia Workshop',
    tags: ['magic', 'power', 'legendary', 'weapon'],
    maxEditions: 50,
  },
};

/**
 * Celestial Crown - Mythic headwear addon
 */
export const CELESTIAL_CROWN: AddonTemplate = {
  id: 'celestial-crown-001',
  name: 'Crown of the Celestials',
  description:
    'A radiant crown worn by the most enlightened beings. Pulses with cosmic energy and grants transcendent wisdom.',
  category: 'headwear',
  rarity: 'mythic',
  attachment: {
    anchorPoint: 'head',
    offset: { x: 0, y: -20, z: 0 },
    scale: 1.0,
    rotation: 0,
    followAnimation: true,
  },
  visual: {
    svgPath: `
      M 20 40 L 25 30 L 30 40 L 35 25 L 40 40 L 45 30 L 50 20 L 55 30 L 60 40 L 65 25 L 70 40 L 75 30 L 80 40
      L 80 45 L 20 45 Z
    `,
    colors: {
      primary: '#FFD700', // Gold
      secondary: '#FFA500', // Orange gold
      accent: '#FFFFFF', // White
      glow: 'rgba(255, 215, 0, 0.8)', // Gold glow
    },
    animation: {
      type: 'shimmer',
      duration: 1500,
      easing: 'ease-in-out',
    },
    particles: {
      count: 20,
      color: '#FFFFFF',
      size: 2,
      behavior: 'burst',
    },
  },
  modifiers: {
    energy: 25,
    curiosity: 25,
    bond: 25,
    luck: 20,
  },
  metadata: {
    creator: 'Auralia Workshop',
    tags: ['celestial', 'divine', 'mythic', 'crown'],
    maxEditions: 10,
  },
};

/**
 * Shadow Cloak - Rare accessory addon
 */
export const SHADOW_CLOAK: AddonTemplate = {
  id: 'shadow-cloak-001',
  name: 'Cloak of Shadows',
  description:
    'A mysterious cloak that shifts and flows like living darkness. Enhances stealth and mystique.',
  category: 'accessory',
  rarity: 'rare',
  attachment: {
    anchorPoint: 'back',
    offset: { x: 0, y: 5, z: -10 },
    scale: 1.3,
    rotation: 0,
    followAnimation: true,
  },
  visual: {
    svgPath: `
      M 30 20 Q 50 10 70 20 L 75 80 Q 50 90 25 80 Z
    `,
    colors: {
      primary: '#1a1a2e',
      secondary: '#16213e',
      accent: '#4a4e69',
      glow: 'rgba(74, 78, 105, 0.3)',
    },
    animation: {
      type: 'float',
      duration: 4000,
      easing: 'ease-in-out',
    },
  },
  modifiers: {
    energy: 5,
    bond: 10,
  },
  metadata: {
    creator: 'Auralia Workshop',
    tags: ['shadow', 'stealth', 'mysterious', 'accessory'],
    maxEditions: 200,
  },
};

/**
 * Prismatic Aura - Epic aura addon
 */
export const PRISMATIC_AURA: AddonTemplate = {
  id: 'prismatic-aura-001',
  name: 'Prismatic Aura',
  description: 'A shimmering aura that cycles through all colors of the spectrum.',
  category: 'aura',
  rarity: 'epic',
  attachment: {
    anchorPoint: 'aura',
    offset: { x: 0, y: 0, z: 0 },
    scale: 1.5,
    rotation: 0,
    followAnimation: false,
  },
  visual: {
    colors: {
      primary: '#FF0080',
      secondary: '#00FFFF',
      accent: '#FFD700',
      glow: 'rgba(255, 0, 128, 0.3)',
    },
    animation: {
      type: 'shimmer',
      duration: 3000,
      easing: 'linear',
    },
    particles: {
      count: 30,
      color: '#FFFFFF',
      size: 2,
      behavior: 'ambient',
    },
  },
  modifiers: {
    energy: 10,
    curiosity: 10,
    bond: 10,
  },
  metadata: {
    creator: 'Auralia Workshop',
    tags: ['aura', 'rainbow', 'prismatic', 'colorful'],
    maxEditions: 150,
  },
};

/**
 * Floating Familiar - Legendary companion addon
 */
export const FLOATING_FAMILIAR: AddonTemplate = {
  id: 'floating-familiar-001',
  name: 'Ethereal Familiar',
  description: 'A small ethereal companion that floats beside your Auralia.',
  category: 'companion',
  rarity: 'legendary',
  attachment: {
    anchorPoint: 'floating',
    offset: { x: 30, y: -15, z: 0 },
    scale: 0.3,
    rotation: 0,
    followAnimation: false,
  },
  visual: {
    svgPath: `
      M 50 20 A 20 20 0 1 1 50 60 A 20 20 0 1 1 50 20
      M 45 35 A 3 3 0 1 1 45 41 A 3 3 0 1 1 45 35
      M 55 35 A 3 3 0 1 1 55 41 A 3 3 0 1 1 55 35
    `,
    colors: {
      primary: '#E0BBE4',
      secondary: '#D4A5D8',
      accent: '#FFDFD3',
      glow: 'rgba(224, 187, 228, 0.5)',
    },
    animation: {
      type: 'float',
      duration: 2500,
      easing: 'ease-in-out',
    },
    particles: {
      count: 5,
      color: '#FFDFD3',
      size: 1.5,
      behavior: 'trail',
    },
  },
  modifiers: {
    bond: 20,
    luck: 15,
  },
  metadata: {
    creator: 'Auralia Workshop',
    tags: ['companion', 'familiar', 'ethereal', 'cute'],
    maxEditions: 75,
  },
};

// ============================================
// PREMIUM ADDONS
// ============================================

/**
 * Holographic Vault - Mythic effect addon (Premium)
 */
export const HOLOGRAPHIC_VAULT: AddonTemplate = {
  id: 'holographic-vault-001',
  name: 'Holographic Vault',
  description: 'A secure, gesture-controlled 3D storage interface with cryptographic authentication.',
  category: 'effect',
  rarity: 'mythic',
  attachment: {
    anchorPoint: 'floating',
    offset: { x: 0, y: 0, z: 0 },
    scale: 1.0,
    rotation: 0,
    followAnimation: false,
  },
  visual: {
    colors: {
      primary: '#4f46e5',
      secondary: '#7c3aed',
      accent: '#22d3ee',
      glow: 'rgba(79, 70, 229, 0.5)',
    },
    animation: {
      type: 'shimmer',
      duration: 2000,
      easing: 'ease-in-out',
    },
  },
  modifiers: {
    bond: 25,
    luck: 20,
  },
  metadata: {
    creator: 'Auralia Premium Workshop',
    tags: ['premium', 'vault', 'holographic', '3d', 'secure'],
    maxEditions: 25,
  },
};

/**
 * Ethereal Background - Mythic effect addon (Premium)
 */
export const ETHEREAL_BACKGROUND: AddonTemplate = {
  id: 'ethereal-background-001',
  name: 'Ethereal Background Engine',
  description: 'Reactive, generative background patterns with mouse-tracking spring physics.',
  category: 'effect',
  rarity: 'mythic',
  attachment: {
    anchorPoint: 'aura',
    offset: { x: 0, y: 0, z: 0 },
    scale: 1.0,
    rotation: 0,
    followAnimation: false,
  },
  visual: {
    colors: {
      primary: '#d946ef',
      secondary: '#3b82f6',
      accent: '#06b6d4',
      glow: 'rgba(217, 70, 239, 0.4)',
    },
    animation: {
      type: 'shimmer',
      duration: 3000,
      easing: 'linear',
    },
  },
  modifiers: {
    energy: 30,
    curiosity: 25,
  },
  metadata: {
    creator: 'Auralia Premium Workshop',
    tags: ['premium', 'background', 'ethereal', 'reactive', 'generative'],
    maxEditions: 25,
  },
};

/**
 * Quantum Data Flow - Mythic effect addon (Premium)
 */
export const QUANTUM_DATA_FLOW: AddonTemplate = {
  id: 'quantum-data-flow-001',
  name: 'Quantum Data Flow',
  description: 'Real-time multi-dimensional data stream visualization with particle-based flow.',
  category: 'effect',
  rarity: 'mythic',
  attachment: {
    anchorPoint: 'floating',
    offset: { x: 0, y: 0, z: 0 },
    scale: 1.0,
    rotation: 0,
    followAnimation: false,
  },
  visual: {
    colors: {
      primary: '#06b6d4',
      secondary: '#3b82f6',
      accent: '#22d3ee',
      glow: 'rgba(6, 182, 212, 0.5)',
    },
    animation: {
      type: 'pulse',
      duration: 1500,
      easing: 'ease-in-out',
    },
    particles: {
      count: 20,
      color: '#22d3ee',
      size: 1,
      behavior: 'ambient',
    },
  },
  modifiers: {
    energy: 25,
    curiosity: 30,
    luck: 15,
  },
  metadata: {
    creator: 'Auralia Premium Workshop',
    tags: ['premium', 'quantum', 'data', 'particles', 'visualization'],
    maxEditions: 25,
  },
};

/**
 * All available addon templates
 */
export const ADDON_CATALOG: Record<string, AddonTemplate> = {
  'wizard-hat-001': WIZARD_HAT,
  'wizard-staff-001': WIZARD_STAFF,
  'celestial-crown-001': CELESTIAL_CROWN,
  'shadow-cloak-001': SHADOW_CLOAK,
  'prismatic-aura-001': PRISMATIC_AURA,
  'floating-familiar-001': FLOATING_FAMILIAR,
  // Premium addons
  'holographic-vault-001': HOLOGRAPHIC_VAULT,
  'ethereal-background-001': ETHEREAL_BACKGROUND,
  'quantum-data-flow-001': QUANTUM_DATA_FLOW,
};

/**
 * Get addon template by ID
 */
export function getAddonTemplate(id: string): AddonTemplate | undefined {
  return ADDON_CATALOG[id];
}

/**
 * Get all addon templates by category
 */
export function getAddonsByCategory(category: AddonCategory): AddonTemplate[] {
  return Object.values(ADDON_CATALOG).filter(addon => addon.category === category);
}

/**
 * Get all addon templates by rarity
 */
export function getAddonsByRarity(rarity: AddonRarity): AddonTemplate[] {
  return Object.values(ADDON_CATALOG).filter(addon => addon.rarity === rarity);
}
