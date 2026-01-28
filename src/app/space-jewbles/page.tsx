'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Zap, Target, Skull } from 'lucide-react';
import Link from 'next/link';

interface GameResult {
  score: number;
  wave: number;
  bossesDefeated: number;
  mythicDrops: number;
}

export default function SpaceJewblesPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);

  // Get pet data from store
  const traits = useStore(s => s.traits);
  const genome = useStore(s => s.genome);
  const miniGames = useStore(s => s.miniGames);
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
        features: [],
        genomeSeed,
      };
    }
    return {
      bodyType: traits.physical.bodyType,
      primaryColor: traits.physical.primaryColor,
      secondaryColor: traits.physical.secondaryColor,
      pattern: traits.physical.pattern,
      features: traits.physical.features,
      genomeSeed,
    };
  }, [traits, genomeSeed]);

  // Handle messages from the game iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GAME_READY') {
        // Send pet data to the game
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'PET_DATA', payload: petData },
          '*'
        );
      } else if (event.data?.type === 'GAME_RESULT') {
        const result = event.data.payload as GameResult;
        setLastResult(result);
        setGameStarted(false);

        // Record the run in the store
        recordSpaceJewblesRun(
          result.score,
          result.wave,
          result.bossesDefeated,
          result.mythicDrops
        );
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [petData, recordSpaceJewblesRun]);

  const handleStartGame = useCallback(() => {
    setGameStarted(true);
    setLastResult(null);
  }, []);

  const handlePlayAgain = useCallback(() => {
    setGameStarted(true);
    setLastResult(null);
    // Force iframe reload
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  }, []);

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col overflow-hidden">
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
            <span>High: {miniGames.spaceJewblesHighScore.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-400">
            <Zap className="w-4 h-4" />
            <span>Wave: {miniGames.spaceJewblesMaxWave}</span>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 relative">
        {!gameStarted ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
            {/* Title Screen / Results */}
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
                Defend the cosmos with your pet and absurd weaponry!
              </p>

              {lastResult && (
                <div className="bg-slate-800/50 rounded-xl p-4 mb-6 space-y-3">
                  <h3 className="text-lg font-semibold text-cyan-300">Last Run</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 justify-center">
                      <Target className="w-4 h-4 text-amber-400" />
                      <span className="text-white">{lastResult.score.toLocaleString()} pts</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span className="text-white">Wave {lastResult.wave}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center">
                      <Skull className="w-4 h-4 text-red-400" />
                      <span className="text-white">{lastResult.bossesDefeated} Bosses</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center">
                      <span className="text-pink-400 text-lg">*</span>
                      <span className="text-white">{lastResult.mythicDrops} Mythic</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <div className="text-amber-400 font-bold text-xl">
                    {miniGames.spaceJewblesHighScore.toLocaleString()}
                  </div>
                  <div className="text-slate-500">High Score</div>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <div className="text-cyan-400 font-bold text-xl">
                    {miniGames.spaceJewblesMaxWave}
                  </div>
                  <div className="text-slate-500">Max Wave</div>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <div className="text-red-400 font-bold text-xl">
                    {miniGames.spaceJewblesBossesDefeated}
                  </div>
                  <div className="text-slate-500">Bosses</div>
                </div>
              </div>

              {/* Weapon preview */}
              <div className="flex justify-center gap-2 mb-6 text-2xl">
                <span title="Banana - Slip!">&#x1F34C;</span>
                <span title="Boot - Stomp!">&#x1F97E;</span>
                <span title="Book - Smart!">&#x1F4DA;</span>
                <span title="Rubber Chicken - Squeak!">&#x1F414;</span>
                <span title="Donut - Sticky!">&#x1F369;</span>
                <span title="Toilet Paper - Pierce!">&#x1F9FB;</span>
                <span title="Cosmic Sock - Stink Bomb!">&#x1F9E6;</span>
              </div>

              <Button
                onClick={lastResult ? handlePlayAgain : handleStartGame}
                className="w-full py-6 text-xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500"
              >
                {lastResult ? 'Play Again' : 'Start Game'}
              </Button>

              <p className="text-slate-500 text-xs mt-4">
                Arrow Keys / WASD to move | Space to fire | 1-7 to switch weapons
              </p>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src="/space-jewbles.html"
            className="absolute inset-0 w-full h-full border-0"
            title="Space Jewbles Game"
            allow="autoplay"
          />
        )}
      </div>

      {/* Bottom padding for nav */}
      <div className="h-20" />
    </div>
  );
}
