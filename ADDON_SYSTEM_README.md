# Auralia Crypto-Secured Addon System

A complete system for creating, verifying, and managing cryptographically-signed cosmetic addons for Auralia pets. Each addon is tied to a specific cryptographic key, making them non-copyable and verifiable.

## 🎯 Features

- **Cryptographic Ownership**: Each addon is signed with ECDSA (P-256) encryption
- **Non-Copyable**: Dual-signature system (owner + issuer) prevents unauthorized duplication
- **Transferable**: Secure addon transfers with signature verification
- **Edition Support**: Limited edition addons with edition tracking
- **Time-Limited Addons**: Optional expiration timestamps for temporary items
- **Gift System**: Create gift codes for sending addons to other users
- **Visual Effects**: Particle systems, animations, and glow effects
- **Stat Modifiers**: Optional gameplay effects (energy, curiosity, bond, luck bonuses)

## 📁 File Structure

```
src/lib/addons/
├── types.ts          # TypeScript interfaces and types
├── crypto.ts         # Cryptographic signing and verification
├── catalog.tsx       # Predefined addon templates
├── mint.ts           # Addon minting system
├── store.ts          # Zustand state management
└── index.ts          # Main exports

src/components/addons/
├── AddonRenderer.tsx        # SVG rendering component
└── AddonInventoryPanel.tsx  # Inventory UI

src/app/addons-demo/
└── page.tsx          # Demo page
```

## 🚀 Quick Start

### 1. Generate Keys

```typescript
import { generateAddonKeypair, initializeAddonStore } from '@/lib/addons';

// Generate user keypair
const userKeys = await generateAddonKeypair();

// Generate issuer keypair (for addon creators/marketplace)
const issuerKeys = await generateAddonKeypair();

// Initialize the addon store
initializeAddonStore(userKeys.publicKey);
```

### 2. Mint an Addon

```typescript
import { mintAddon, WIZARD_HAT } from '@/lib/addons';

const addon = await mintAddon(
  {
    addonTypeId: WIZARD_HAT.id,
    recipientPublicKey: userKeys.publicKey,
    edition: 1,
  },
  issuerKeys.privateKey,
  issuerKeys.publicKey,
  userKeys.privateKey
);
```

### 3. Add to Inventory

```typescript
import { useAddonStore } from '@/lib/addons';

const { addAddon } = useAddonStore();
const success = await addAddon(addon);
```

### 4. Equip Addon

```typescript
const { equipAddon } = useAddonStore();
equipAddon(addon.id);
```

## 🎨 Available Addons

### Standard Addons

#### Wizard Hat (Epic)
- **Category**: Headwear
- **Bonuses**: +15 Curiosity, +10 Bond
- **Max Editions**: 100
- **Visual**: Deep purple pointed hat with gold accents and floating particles

#### Wizard Staff (Legendary)
- **Category**: Weapon
- **Bonuses**: +20 Energy, +20 Curiosity, +15 Bond, +10 Luck
- **Max Editions**: 50
- **Visual**: Ancient wooden staff with glowing cyan crystal

#### Celestial Crown (Mythic)
- **Category**: Headwear
- **Bonuses**: +25 Energy, +25 Curiosity, +25 Bond, +20 Luck
- **Max Editions**: 10
- **Visual**: Radiant golden crown with shimmering effect

#### Shadow Cloak (Rare)
- **Category**: Accessory
- **Bonuses**: +5 Energy, +10 Bond
- **Max Editions**: 200
- **Visual**: Mysterious dark cloak with flowing animation

#### Prismatic Aura (Epic)
- **Category**: Aura
- **Bonuses**: +10 Energy, +10 Curiosity, +10 Bond
- **Max Editions**: 150
- **Visual**: Rainbow shimmer effect with particle ambient

#### Floating Familiar (Legendary)
- **Category**: Companion
- **Bonuses**: +20 Bond, +15 Luck
- **Max Editions**: 75
- **Visual**: Small ethereal companion with trail particles

---

### Premium Addons ✨

#### Holographic Vault (Mythic)
- **Category**: Effect
- **Bonuses**: +25 Bond, +20 Luck
- **Max Editions**: 25
- **Visual**: Floating 3D cube vault with holographic display panels and ambient particles

#### Ethereal Background Engine (Mythic)
- **Category**: Effect
- **Bonuses**: +30 Energy, +25 Curiosity
- **Max Editions**: 25
- **Visual**: Flowing ethereal waves pattern with shimmer animation and 25 ambient particles

#### Quantum Data Flow (Mythic)
- **Category**: Effect
- **Bonuses**: +25 Energy, +30 Curiosity, +15 Luck
- **Max Editions**: 25
- **Visual**: Orbiting data streams with quantum rings, nodes, and 16 orbiting particles

#### Phoenix Wings (Legendary)
- **Category**: Accessory
- **Bonuses**: +30 Energy, +15 Curiosity, +20 Luck
- **Max Editions**: 30
- **Visual**: Majestic fiery wings with feather patterns and trailing ember particles

#### Crystal Heart (Epic)
- **Category**: Companion
- **Bonuses**: +35 Bond, +10 Energy
- **Max Editions**: 50
- **Visual**: Floating crystalline heart with facets, pulse animation and ambient particles

#### Mask of the Void (Mythic)
- **Category**: Headwear
- **Bonuses**: +40 Curiosity, +15 Bond, +25 Luck
- **Max Editions**: 15
- **Visual**: Ornate mysterious mask with eye holes, decorative patterns, and void particles

## 🔐 How Crypto Security Works

### Dual Signature System

Each addon has two signatures:

1. **Owner Signature**: Signed with the recipient's private key
2. **Issuer Signature**: Signed with the issuer's (creator's) private key

Both signatures must be valid for the addon to be verified.

### Signing Payload

```typescript
{
  id: string,
  name: string,
  category: AddonCategory,
  rarity: AddonRarity,
  owner: string (public key),
  nonce: string (random),
  issuedAt: number (timestamp),
  expiresAt?: number
}
```

### Verification Process

```typescript
import { verifyAddon } from '@/lib/addons';

const result = await verifyAddon(addon);

if (result.valid) {
  console.log('Addon is authentic!');
} else {
  console.error('Verification failed:', result.errors);
}
```

## 🎁 Gifting Addons

Create a gift code to send an addon to another user:

```typescript
import { createGiftAddon, validateClaimCode } from '@/lib/addons';

// Sender creates gift
const { addon, claimCode } = await createGiftAddon(
  'wizard-hat-001',
  senderPublicKey,
  senderPrivateKey,
  recipientPublicKey,
  issuerPrivateKey,
  issuerPublicKey
);

// Recipient validates claim code
const claimInfo = validateClaimCode(claimCode);
if (claimInfo.valid) {
  // Add addon to recipient's inventory
  await addAddon(addon);
}
```

## 🔄 Transferring Addons

Transfer an addon to another user:

```typescript
import { useAddonStore } from '@/lib/addons';

const { transferAddon, receiveAddon } = useAddonStore();

// Sender transfers
const transfer = await transferAddon(
  addonId,
  recipientPublicKey,
  senderPrivateKey
);

// Recipient receives (on their device)
const success = await receiveAddon(addon, transfer);
```

## 📊 Addon Structure

```typescript
interface Addon {
  id: string;
  name: string;
  description: string;
  category: 'headwear' | 'weapon' | 'accessory' | 'aura' | 'companion' | 'effect';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

  attachment: {
    anchorPoint: 'head' | 'body' | 'left-hand' | 'right-hand' | 'back' | 'floating' | 'aura';
    offset: { x: number; y: number; z?: number };
    scale: number;
    rotation: number;
    followAnimation: boolean;
  };

  visual: {
    svgPath?: string;
    colors: {
      primary: string;
      secondary?: string;
      accent?: string;
      glow?: string;
    };
    animation?: {
      type: 'float' | 'rotate' | 'pulse' | 'shimmer' | 'sparkle' | 'glow';
      duration: number;
    };
    particles?: {
      count: number;
      color: string;
      size: number;
      behavior: 'orbit' | 'trail' | 'burst' | 'ambient';
    };
  };

  modifiers?: {
    energy?: number;
    curiosity?: number;
    bond?: number;
    luck?: number;
  };

  ownership: {
    ownerPublicKey: string;
    signature: string;
    issuedAt: number;
    expiresAt?: number;
    issuerPublicKey: string;
    issuerSignature: string;
    nonce: string;
  };

  metadata: {
    creator: string;
    createdAt: number;
    edition?: number;
    maxEditions?: number;
    tags?: string[];
  };
}
```

## 🎮 Using in Components

### Render Equipped Addons

```tsx
import { AddonRenderer, AddonSVGDefs } from '@/components/addons/AddonRenderer';
import { useAddonStore } from '@/lib/addons';

function PetViewer() {
  const { getEquippedAddons } = useAddonStore();
  const equippedAddons = getEquippedAddons();

  return (
    <svg viewBox="0 0 200 200">
      <AddonSVGDefs />

      {/* Your pet rendering */}
      <g>...</g>

      {/* Render addons */}
      {equippedAddons.map(addon => (
        <AddonRenderer
          key={addon.id}
          addon={addon}
          petSize={40}
          petPosition={{ x: 100, y: 100 }}
          animationPhase={Date.now()}
        />
      ))}
    </svg>
  );
}
```

### Inventory UI

```tsx
import { AddonInventoryPanel } from '@/components/addons/AddonInventoryPanel';

function InventoryPage() {
  return (
    <div>
      <AddonInventoryPanel />
    </div>
  );
}
```

## 🛠️ Creating Custom Addons

### 1. Define Addon Template

```typescript
import type { AddonTemplate } from '@/lib/addons';

export const CUSTOM_ADDON: AddonTemplate = {
  id: 'custom-addon-001',
  name: 'My Custom Addon',
  description: 'A unique addon',
  category: 'accessory',
  rarity: 'epic',

  attachment: {
    anchorPoint: 'body',
    offset: { x: 0, y: 10, z: 0 },
    scale: 1.0,
    rotation: 0,
    followAnimation: true,
  },

  visual: {
    svgPath: 'M 30 30 L 70 30 L 70 70 L 30 70 Z', // SVG path
    colors: {
      primary: '#FF6B6B',
      accent: '#FFD93D',
      glow: 'rgba(255, 107, 107, 0.4)',
    },
    animation: {
      type: 'pulse',
      duration: 2000,
    },
  },

  modifiers: {
    energy: 10,
    bond: 5,
  },

  metadata: {
    creator: 'Your Name',
    maxEditions: 50,
    tags: ['custom', 'unique'],
  },
};
```

### 2. Add to Catalog

```typescript
// In src/lib/addons/catalog.tsx
export const ADDON_CATALOG: Record<string, AddonTemplate> = {
  'wizard-hat-001': WIZARD_HAT,
  'wizard-staff-001': WIZARD_STAFF,
  'custom-addon-001': CUSTOM_ADDON, // Add your addon
};
```

## 📱 Demo Page

Visit `/addons-demo` to see the system in action:

- Mint new addons
- View equipped addons on a pet
- Manage inventory
- Test verification system

## 🔒 Security Considerations

1. **Private Key Storage**: Store private keys securely (localStorage in demo, use secure vault in production)
2. **Nonce Generation**: Each addon has a unique nonce to prevent replay attacks
3. **Signature Verification**: Always verify addons before accepting them
4. **Transfer Validation**: Verify transfer signatures before accepting addons from others
5. **Edition Limits**: Enforce max edition limits during minting

## 🎯 Use Cases

- **Virtual Pet Cosmetics**: Dress up your Auralia with unique items
- **Achievement Rewards**: Grant special addons for completing tasks
- **Limited Edition Collectibles**: Create scarce, valuable items
- **Marketplace**: Trade or sell addons with verified ownership
- **Events**: Time-limited seasonal addons
- **Gifts**: Send addons to friends
- **Progression Systems**: Unlock addons as players advance

## 🧪 Testing

```bash
# Visit the demo page
npm run dev
# Navigate to http://localhost:3000/addons-demo

# Mint addons, equip them, and verify they render correctly
```

## 📝 License

Part of the Auralia MetaPet project.

---

**Built with:**
- Web Crypto API (ECDSA P-256)
- Zustand (State Management)
- React + TypeScript
- SVG Graphics
