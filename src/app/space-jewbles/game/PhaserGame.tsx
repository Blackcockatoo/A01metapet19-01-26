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
  const onGameEndRef = useRef(onGameEnd);
  const petDataRef = useRef(petData);
  const handleGameEndRef = useRef<((event: Event) => void) | null>(null);

  if (!handleGameEndRef.current) {
    handleGameEndRef.current = (event: Event) => {
      const customEvent = event as CustomEvent;
      onGameEndRef.current?.(customEvent.detail);
    };
  }

  useEffect(() => {
    onGameEndRef.current = onGameEnd;
  }, [onGameEnd]);

  useEffect(() => {
    petDataRef.current = petData;
  }, [petData]);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    window.addEventListener('gameEnd', handleGameEndRef.current as EventListener);

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
            menuScene.events.emit('petData', petDataRef.current);
          }
        });
      });
    });

    // Cleanup on unmount
    return () => {
      window.removeEventListener('gameEnd', handleGameEndRef.current as EventListener);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="phaser-game-container"
      className="w-full h-full flex items-center justify-center"
      style={{ touchAction: 'none' }} // Prevent default touch behaviors
    />
  );
}
