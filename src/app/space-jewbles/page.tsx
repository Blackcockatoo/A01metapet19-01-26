'use client';

import { useCallback, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Zap, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { checkSpaceJewblesRewards } from '@/lib/addons/starter';
import { createDefaultMiniGameProgress } from '@/lib/progression/types';
import { PhaserGame } from './game/PhaserGame';

interface GameResult {
  score: number;
  wave: number;
  bossesDefeated: number;
  mythicDrops: number;
}

export default function SpaceJewblesPage() {
  const [gameStarted, setGameStarted] = useState(false);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [newUnlocks, setNewUnlocks] = useState<string[]>([]);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);

  // Get pet data from store
  const traits = useStore(s => s.traits);
  const genome = useStore(s => s.genome);
  const miniGames = useStore(s => s.miniGames);
  const safeMiniGames = useMemo(() => miniGames ?? createDefaultMiniGameProgress(), [miniGames]);
  const recordSpaceJewblesRun = useStore(s => s.recordSpaceJewblesRun);

  // Generate genome seed for consistency
  const genomeSeed = useMemo(() => {
    if (!genome) return undefined;
    const slices = [
      ...genome.red60.slice(0, 12),
      ...genome.blue60.slice(0, 12),
      ...genome.black60.slice(0, 12),
    ];
    return slices.reduce((total, value, index) => total + value * (index + 5), 0);
  }, [genome]);

  // Build pet data to send to the game
  const petData = useMemo(() => {
    if (!traits?.physical) {
      return {
        bodyType: 'Spherical',
        primaryColor: '#00FFFF',
        secondaryColor: '#FF00FF',
        pattern: 'Solid',
        texture: 'Smooth',
        size: 1,
        features: [],
        genomeSeed,
      };
    }
    return {
      bodyType: traits.physical.bodyType,
      primaryColor: traits.physical.primaryColor,
      secondaryColor: traits.physical.secondaryColor,
      pattern: traits.physical.pattern,
      texture: traits.physical.texture,
      size: traits.physical.size,
      features: traits.physical.features,
      genomeSeed,
    };
  }, [traits, genomeSeed]);

  const handleGameEnd = useCallback(async (result: GameResult) => {
    setLastResult(result);
    setGameStarted(false);

    // Record the run in the store
    recordSpaceJewblesRun(
      result.score,
      result.wave,
      result.bossesDefeated,
      result.mythicDrops
    );

    // Check for addon rewards with updated totals
    const updatedStats = {
      maxWave: Math.max(safeMiniGames.spaceJewblesMaxWave, result.wave),
      bossesDefeated: safeMiniGames.spaceJewblesBossesDefeated + result.bossesDefeated,
      mythicDrops: safeMiniGames.spaceJewblesMythicDrops + result.mythicDrops,
    };

    const rewards = await checkSpaceJewblesRewards(updatedStats);
    if (rewards.newUnlocks.length > 0) {
      setNewUnlocks(rewards.newUnlocks);
      setShowUnlockAnimation(true);
      setTimeout(() => setShowUnlockAnimation(false), 5000);
    }
  }, [recordSpaceJewblesRun, safeMiniGames]);

  const handleStartGame = useCallback(() => {
    setGameStarted(true);
    setLastResult(null);
    setNewUnlocks([]);
  }, []);

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col overflow-hidden">
      {/* Unlock Animation Overlay */}
      {showUnlockAnimation && newUnlocks.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in"
          aria-live="polite"
          role="status"
        >
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-8 border-2 border-amber-400 shadow-2xl animate-bounce-in">
            <div className="text-center">
              <Sparkles className="w-16 h-16 text-amber-400 mx-auto mb-4 animate-pulse" />
              <h2 className="text-3xl font-bold text-amber-400 mb-2">Addon Unlocked!</h2>
              {newUnlocks.map((name, i) => (
                <p key={i} className="text-xl text-white">{name}</p>
              ))}
              <p className="text-slate-400 mt-4 text-sm">Check your addon inventory!</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <Link href="/pet">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pet
          </Button>
        </Link>

        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Space Jewbles
        </h1>

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2 text-amber-400">
            <Trophy className="w-4 h-4" />
            <span aria-live="polite">
              High: {safeMiniGames.spaceJewblesHighScore.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-cyan-400">
            <Zap className="w-4 h-4" />
            <span aria-live="polite">Wave: {safeMiniGames.spaceJewblesMaxWave}</span>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 relative">
        {!gameStarted ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
            <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-8 text-center">
              {/* Animated title */}
              <div className="text-6xl mb-6 animate-bounce">
                <span className="text-cyan-400">S</span>
                <span className="text-purple-400">P</span>
                <span className="text-pink-400">A</span>
                <span className="text-amber-400">C</span>
                <span className="text-emerald-400">E</span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-2">JEWBLES</h2>
              <p className="text-slate-400 mb-6">
                Tap to attack! Idle to progress! Learn your pet&apos;s story!
              </p>

              {lastResult && (
                <div className="bg-slate-800/50 rounded-xl p-4 mb-6" aria-live="polite">
                  <h3 className="text-lg font-semibold text-cyan-300 mb-2">Last Run</h3>
                  <p className="text-white">Score: {lastResult.score.toLocaleString()}</p>
                  <p className="text-white">Wave: {lastResult.wave}</p>
                </div>
              )}

              <Button
                onClick={handleStartGame}
                className="w-full py-6 text-xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
              >
                {lastResult ? 'Play Again' : 'Start Game'}
              </Button>

              <p className="text-slate-500 text-xs mt-4">
                Tap anywhere to fire weapons. Mobile-optimized!
              </p>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0">
            <PhaserGame petData={petData} onGameEnd={handleGameEnd} />
          </div>
        )}
      </div>

      {/* Bottom padding for nav */}
      <div className="h-20" />
    </div>
  );
}
