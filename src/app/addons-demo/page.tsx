/**
 * Addon System Demo Page
 *
 * Showcases the crypto-secured addon system with wizard hat and staff
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AddonInventoryPanel } from '@/components/addons/AddonInventoryPanel';
import { AddonRenderer, AddonSVGDefs } from '@/components/addons/AddonRenderer';
import {
  generateAddonKeypair,
  mintAddon,
  useAddonStore,
  initializeAddonStore,
  WIZARD_HAT,
  WIZARD_STAFF,
  CELESTIAL_CROWN,
  SHADOW_CLOAK,
  PRISMATIC_AURA,
  FLOATING_FAMILIAR,
  verifyAddon,
} from '@/lib/addons';

export default function AddonsDemoPage() {
  const [userKeys, setUserKeys] = useState<{ publicKey: string; privateKey: string } | null>(
    null
  );
  const [issuerKeys, setIssuerKeys] = useState<{ publicKey: string; privateKey: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  const { addAddon, getEquippedAddons } = useAddonStore();

  // Initialize keys
  useEffect(() => {
    const initKeys = async () => {
      // Check if keys exist in localStorage
      const storedUserKeys = localStorage.getItem('auralia_addon_user_keys');
      const storedIssuerKeys = localStorage.getItem('auralia_addon_issuer_keys');

      if (storedUserKeys && storedIssuerKeys) {
        const userKeysData = JSON.parse(storedUserKeys);
        const issuerKeysData = JSON.parse(storedIssuerKeys);
        setUserKeys(userKeysData);
        setIssuerKeys(issuerKeysData);
        initializeAddonStore(userKeysData.publicKey);
      } else {
        // Generate new keys
        const newUserKeys = await generateAddonKeypair();
        const newIssuerKeys = await generateAddonKeypair();

        setUserKeys(newUserKeys);
        setIssuerKeys(newIssuerKeys);

        // Store keys
        localStorage.setItem('auralia_addon_user_keys', JSON.stringify(newUserKeys));
        localStorage.setItem('auralia_addon_issuer_keys', JSON.stringify(newIssuerKeys));

        initializeAddonStore(newUserKeys.publicKey);
      }
    };

    initKeys();
  }, []);

  // Animation loop
  useEffect(() => {
    let animationFrame: number;
    let lastTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;

      setAnimationPhase((prev) => prev + delta);
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const handleMintAddon = async (addonTemplate: typeof WIZARD_HAT) => {
    if (!userKeys || !issuerKeys) {
      alert('Keys not initialized');
      return;
    }

    setLoading(true);

    try {
      // Mint the addon
      const addon = await mintAddon(
        {
          addonTypeId: addonTemplate.id,
          recipientPublicKey: userKeys.publicKey,
          edition: Date.now() % 1000, // Random edition number
        },
        issuerKeys.privateKey,
        issuerKeys.publicKey,
        userKeys.privateKey
      );

      // Verify the addon
      const verification = await verifyAddon(addon);
      console.log('Addon verification:', verification);

      if (!verification.valid) {
        alert('Addon verification failed: ' + verification.errors.join(', '));
        return;
      }

      // Add to inventory
      const success = await addAddon(addon);

      if (success) {
        alert(`Successfully minted ${addon.name}!`);
      } else {
        alert('Failed to add addon to inventory');
      }
    } catch (error) {
      console.error('Failed to mint addon:', error);
      alert('Failed to mint addon: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const equippedAddons = getEquippedAddons();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Auralia Addon System</h1>
          <p className="text-slate-300">Crypto-Secured Cosmetic Items</p>
          {userKeys && (
            <p className="text-xs text-slate-500 mt-2">
              Your Key: {userKeys.publicKey.substring(0, 20)}...
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Preview */}
          <div className="space-y-6">
            {/* Pet Preview with Addons */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Preview</h2>
              <div className="aspect-square bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <AddonSVGDefs />

                  {/* Simple Auralia representation */}
                  <g transform="translate(100, 100)">
                    {/* Body */}
                    <ellipse
                      cx="0"
                      cy="8"
                      rx="20"
                      ry="25"
                      fill="url(#bodyGradient)"
                      filter="url(#glow)"
                    />

                    {/* Head */}
                    <ellipse
                      cx="0"
                      cy="-12"
                      rx="15"
                      ry="14"
                      fill="url(#bodyGradient)"
                      filter="url(#glow)"
                    />

                    {/* Eyes */}
                    <ellipse cx="-6" cy="-12" rx="3" ry="3" fill="#4ECDC4" />
                    <ellipse cx="6" cy="-12" rx="3" ry="3" fill="#4ECDC4" />

                    <defs>
                      <radialGradient id="bodyGradient" cx="50%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity="0.9" />
                      </radialGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                  </g>

                  {/* Render equipped addons */}
                  {equippedAddons.map((addon) => (
                    <AddonRenderer
                      key={addon.id}
                      addon={addon}
                      petSize={40}
                      petPosition={{ x: 100, y: 100 }}
                      animationPhase={animationPhase}
                    />
                  ))}
                </svg>
              </div>

              {/* Equipped Addons List */}
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-white mb-2">Equipped:</h3>
                {equippedAddons.length === 0 ? (
                  <p className="text-xs text-slate-400">No addons equipped</p>
                ) : (
                  <div className="space-y-1">
                    {equippedAddons.map((addon) => (
                      <div
                        key={addon.id}
                        className="text-xs text-slate-300 bg-slate-800/50 rounded px-2 py-1"
                      >
                        {addon.name} ({addon.category})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mint Addons */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Mint Addons</h2>
              <div className="grid grid-cols-2 gap-3">
                <MintButton
                  name="Wizard Hat"
                  rarity="epic"
                  onClick={() => handleMintAddon(WIZARD_HAT)}
                  loading={loading}
                />
                <MintButton
                  name="Wizard Staff"
                  rarity="legendary"
                  onClick={() => handleMintAddon(WIZARD_STAFF)}
                  loading={loading}
                />
                <MintButton
                  name="Celestial Crown"
                  rarity="mythic"
                  onClick={() => handleMintAddon(CELESTIAL_CROWN)}
                  loading={loading}
                />
                <MintButton
                  name="Shadow Cloak"
                  rarity="rare"
                  onClick={() => handleMintAddon(SHADOW_CLOAK)}
                  loading={loading}
                />
                <MintButton
                  name="Prismatic Aura"
                  rarity="epic"
                  onClick={() => handleMintAddon(PRISMATIC_AURA)}
                  loading={loading}
                />
                <MintButton
                  name="Floating Familiar"
                  rarity="legendary"
                  onClick={() => handleMintAddon(FLOATING_FAMILIAR)}
                  loading={loading}
                />
              </div>
            </div>
          </div>

          {/* Right: Inventory */}
          <div>
            <AddonInventoryPanel />
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 text-sm text-blue-200">
          <h3 className="font-bold mb-2">🔐 How Crypto-Secured Addons Work:</h3>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Each addon is cryptographically signed with ECDSA (P-256)</li>
            <li>Ownership is verified via dual signatures (owner + issuer)</li>
            <li>Addons cannot be copied - the signature proves authenticity</li>
            <li>Transfers require the owner's private key to sign</li>
            <li>All addons are verified before being added to inventory</li>
            <li>Your keys are stored locally and never leave your browser</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

interface MintButtonProps {
  name: string;
  rarity: string;
  onClick: () => void;
  loading: boolean;
}

const MintButton: React.FC<MintButtonProps> = ({ name, rarity, onClick, loading }) => {
  const rarityColors = {
    rare: 'from-blue-600 to-blue-700',
    epic: 'from-purple-600 to-purple-700',
    legendary: 'from-orange-600 to-orange-700',
    mythic: 'from-pink-600 to-pink-700',
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`bg-gradient-to-br ${
        rarityColors[rarity as keyof typeof rarityColors]
      } text-white font-medium py-3 px-4 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <div className="text-sm">{name}</div>
      <div className="text-xs opacity-75 capitalize">{rarity}</div>
    </button>
  );
};
