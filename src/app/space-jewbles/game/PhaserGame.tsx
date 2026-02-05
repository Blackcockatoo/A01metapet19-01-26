'use client';

import { useEffect, useRef } from 'react';

interface PhaserGameProps {
  petData: any;
  onGameEnd?: (stats: {
    score: number;
    wave: number;
    bossesDefeated: number;
    mythicDrops: number;
  }) => void;
}

export function PhaserGame({ petData, onGameEnd }: PhaserGameProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    // Dynamic import of Phaser to avoid SSR issues
    import('phaser').then((PhaserModule) => {
      const Phaser = PhaserModule.default || PhaserModule;

      // Dynamic import of config
      import('./config').then((configModule) => {
        const { gameConfig } = configModule;

        // Initialize Phaser game
        gameRef.current = new Phaser.Game({
          ...gameConfig,
          parent: containerRef.current!,
        });

        // Send pet data to MenuScene when game is ready
        gameRef.current.events.once('ready', () => {
          const menuScene = gameRef.current?.scene.getScene('MenuScene');
          if (menuScene) {
            menuScene.events.emit('petData', petData);
          }
        });

        // Listen for game end event from GameScene
        const handleGameEnd = (event: CustomEvent) => {
          if (onGameEnd) {
            onGameEnd(event.detail);
          }
        };

        window.addEventListener('gameEnd', handleGameEnd as EventListener);
      });
    });

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [petData, onGameEnd]);

  return (
    <div
      ref={containerRef}
      id="phaser-game-container"
      className="w-full h-full flex items-center justify-center"
      style={{ touchAction: 'none' }} // Prevent default touch behaviors
    />
  );
}
