/**
 * Coat of Arms Generator
 *
 * Creates heraldic coats of arms that encode lineage information
 */

import type {
  CoatOfArms,
  HeraldDivision,
  HeraldTincture,
  HeraldCharge,
  PositionedCharge,
  LineageMarker,
  BreedingCoatOfArms,
} from './types';

/**
 * Generate a founder coat of arms (for pets with no parents)
 */
export function generateFounderCoatOfArms(petId: string, seed: number): CoatOfArms {
  const rng = createSeededRNG(seed);

  // Select division based on seed
  const divisions: HeraldDivision[] = ['plain', 'per-pale', 'per-fess', 'quarterly'];
  const division = divisions[Math.floor(rng() * divisions.length)];

  // Select tinctures
  const tinctures: HeraldTincture[] = ['or', 'argent', 'azure', 'gules', 'sable', 'vert', 'purpure'];
  const field = tinctures[Math.floor(rng() * tinctures.length)];

  // Secondary field for divided shields
  let fieldSecondary: HeraldTincture | undefined;
  if (division !== 'plain') {
    const availableTinctures = tinctures.filter(t => t !== field);
    fieldSecondary = availableTinctures[Math.floor(rng() * availableTinctures.length)];
  }

  // Select 1-3 charges
  const chargeTypes: HeraldCharge[] = [
    'star', 'moon', 'sun', 'cross', 'lion', 'eagle',
    'tree', 'flower', 'crown', 'key', 'sword', 'book', 'orb'
  ];

  const numCharges = 1 + Math.floor(rng() * 3);
  const charges: PositionedCharge[] = [];

  for (let i = 0; i < numCharges; i++) {
    const charge = chargeTypes[Math.floor(rng() * chargeTypes.length)];
    const chargeTincture = tinctures[Math.floor(rng() * tinctures.length)];

    charges.push({
      charge,
      tincture: chargeTincture,
      position: {
        x: 30 + rng() * 40, // Center region
        y: 30 + rng() * 40,
        scale: 0.8 + rng() * 0.4,
        rotation: Math.floor(rng() * 360),
      },
    });
  }

  return {
    id: `coa-${petId}-gen0`,
    division,
    field,
    fieldSecondary,
    charges,
    generation: 0,
    lineageMarkers: [],
    createdAt: Date.now(),
  };
}

/**
 * Breed two coats of arms to create offspring coat
 */
export function breedCoatsOfArms(
  parent1: CoatOfArms,
  parent2: CoatOfArms,
  offspringId: string,
  seed: number
): BreedingCoatOfArms {
  const rng = createSeededRNG(seed);

  // New generation
  const generation = Math.max(parent1.generation, parent2.generation) + 1;

  // Inheritance logic
  const inheritance = {
    fromParent1: { division: false, field: false, charges: [] as number[] },
    fromParent2: { division: false, field: false, charges: [] as number[] },
    novel: { charges: [] as number[] },
  };

  // Inherit division (50/50 chance from each parent, or combine)
  let division: HeraldDivision;
  const divisionRoll = rng();

  if (divisionRoll < 0.45) {
    division = parent1.division;
    inheritance.fromParent1.division = true;
  } else if (divisionRoll < 0.9) {
    division = parent2.division;
    inheritance.fromParent2.division = true;
  } else {
    // Mutation - create quarterly to represent both lineages
    division = 'quarterly';
  }

  // Inherit field colors
  let field: HeraldTincture;
  let fieldSecondary: HeraldTincture | undefined;

  const fieldRoll = rng();
  if (fieldRoll < 0.5) {
    field = parent1.field;
    inheritance.fromParent1.field = true;
  } else {
    field = parent2.field;
    inheritance.fromParent2.field = true;
  }

  if (division !== 'plain') {
    const secondaryRoll = rng();
    if (secondaryRoll < 0.4) {
      fieldSecondary = parent1.fieldSecondary || parent1.field;
    } else if (secondaryRoll < 0.8) {
      fieldSecondary = parent2.fieldSecondary || parent2.field;
    } else {
      // Mutation - new color
      const tinctures: HeraldTincture[] = ['or', 'argent', 'azure', 'gules', 'sable', 'vert', 'purpure'];
      fieldSecondary = tinctures[Math.floor(rng() * tinctures.length)];
    }
  }

  // Inherit charges - combine from both parents
  const charges: PositionedCharge[] = [];
  const maxCharges = 4;

  // Take 1-2 charges from parent1
  const parent1ChargeCount = Math.min(parent1.charges.length, 1 + Math.floor(rng() * 2));
  for (let i = 0; i < parent1ChargeCount && charges.length < maxCharges; i++) {
    const sourceCharge = parent1.charges[Math.floor(rng() * parent1.charges.length)];
    charges.push({
      ...sourceCharge,
      position: {
        x: 20 + rng() * 30, // Left side
        y: 30 + rng() * 40,
        scale: 0.6 + rng() * 0.3,
        rotation: Math.floor(rng() * 360),
      },
    });
    inheritance.fromParent1.charges.push(charges.length - 1);
  }

  // Take 1-2 charges from parent2
  const parent2ChargeCount = Math.min(parent2.charges.length, 1 + Math.floor(rng() * 2));
  for (let i = 0; i < parent2ChargeCount && charges.length < maxCharges; i++) {
    const sourceCharge = parent2.charges[Math.floor(rng() * parent2.charges.length)];
    charges.push({
      ...sourceCharge,
      position: {
        x: 50 + rng() * 30, // Right side
        y: 30 + rng() * 40,
        scale: 0.6 + rng() * 0.3,
        rotation: Math.floor(rng() * 360),
      },
    });
    inheritance.fromParent2.charges.push(charges.length - 1);
  }

  // 10% chance of mutation - add new charge
  if (rng() < 0.1 && charges.length < maxCharges) {
    const chargeTypes: HeraldCharge[] = ['star', 'moon', 'sun', 'cross', 'crown', 'orb'];
    const tinctures: HeraldTincture[] = ['or', 'argent', 'azure', 'gules'];

    charges.push({
      charge: chargeTypes[Math.floor(rng() * chargeTypes.length)],
      tincture: tinctures[Math.floor(rng() * tinctures.length)],
      position: {
        x: 40 + rng() * 20, // Center
        y: 40 + rng() * 20,
        scale: 0.5 + rng() * 0.3,
        rotation: Math.floor(rng() * 360),
      },
    });
    inheritance.novel.charges.push(charges.length - 1);
  }

  // Create lineage markers
  const lineageMarkers: LineageMarker[] = [];

  // Add markers from parent 1 (left side)
  if (parent1.charges.length > 0) {
    lineageMarkers.push({
      generation: 0,
      side: 'left',
      tincture: parent1.field,
      charge: parent1.charges[0].charge,
      position: 'top-left',
    });
  }

  // Add markers from parent 2 (right side)
  if (parent2.charges.length > 0) {
    lineageMarkers.push({
      generation: 0,
      side: 'right',
      tincture: parent2.field,
      charge: parent2.charges[0].charge,
      position: 'top-right',
    });
  }

  // Inherit grandparent markers
  parent1.lineageMarkers.forEach(marker => {
    lineageMarkers.push({
      ...marker,
      generation: marker.generation + 1,
      position: 'border',
    });
  });

  parent2.lineageMarkers.forEach(marker => {
    lineageMarkers.push({
      ...marker,
      generation: marker.generation + 1,
      position: 'border',
    });
  });

  const offspring: CoatOfArms = {
    id: `coa-${offspringId}-gen${generation}`,
    division,
    field,
    fieldSecondary,
    charges,
    generation,
    lineageMarkers,
    createdAt: Date.now(),
  };

  return {
    offspring,
    inheritance,
  };
}

/**
 * Create a seeded RNG for deterministic generation
 */
function createSeededRNG(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * Get heraldic description (blazon) of coat of arms
 */
export function getBlason(coa: CoatOfArms): string {
  const parts: string[] = [];

  // Field
  if (coa.division === 'plain') {
    parts.push(tinctureToName(coa.field));
  } else {
    parts.push(`${divisionToName(coa.division)}, ${tinctureToName(coa.field)} and ${tinctureToName(coa.fieldSecondary!)}`);
  }

  // Charges
  if (coa.charges.length > 0) {
    const chargeDesc = coa.charges
      .map(c => `a ${chargeToName(c.charge)} ${tinctureToName(c.tincture)}`)
      .join(', ');
    parts.push(`bearing ${chargeDesc}`);
  }

  // Generation
  if (coa.generation > 0) {
    parts.push(`of the ${ordinal(coa.generation + 1)} generation`);
  }

  return parts.join(', ');
}

function divisionToName(div: HeraldDivision): string {
  const names: Record<HeraldDivision, string> = {
    'plain': 'plain',
    'per-pale': 'per pale',
    'per-fess': 'per fess',
    'per-bend': 'per bend',
    'per-saltire': 'per saltire',
    'quarterly': 'quarterly',
    'chevron': 'chevron',
    'canton': 'canton',
  };
  return names[div];
}

function tinctureToName(tincture: HeraldTincture): string {
  const names: Record<HeraldTincture, string> = {
    'or': 'Or (gold)',
    'argent': 'Argent (silver)',
    'azure': 'Azure (blue)',
    'gules': 'Gules (red)',
    'sable': 'Sable (black)',
    'vert': 'Vert (green)',
    'purpure': 'Purpure (purple)',
    'tenne': 'Tenné (orange)',
  };
  return names[tincture];
}

function chargeToName(charge: HeraldCharge): string {
  return charge;
}

function ordinal(n: number): string {
  const suffix = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
}
