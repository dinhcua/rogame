import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Game } from '../types/game';
import useGameStore from '../store/gameStore';

interface ScanProgress {
  percentage: number;
  steamGamesCount: number;
  epicGamesCount: number;
}

export const useGameScanner = () => {
  const { foundGames, setFoundGames, addFoundGameToLibrary } = useGameStore();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    percentage: 0,
    steamGamesCount: 0,
    epicGamesCount: 0,
  });
  const [showFoundGames, setShowFoundGames] = useState(false);

  const startScan = useCallback(async () => {
    setIsScanning(true);
    setShowFoundGames(false);
    setScanProgress({
      percentage: 0,
      steamGamesCount: 0,
      epicGamesCount: 0,
    });

    // Simulate scanning progress
    const progressInterval = setInterval(() => {
      setScanProgress((prev) => ({
        ...prev,
        percentage: Math.min(prev.percentage + 10, 100),
      }));
    }, 500);

    try {
      const result = await invoke<Record<string, Game>>('scan_games');
      const games = Object.values(result);

      // Count games by platform
      const steamGames = games.filter((game) => game.platform === 'Steam');
      const epicGames = games.filter((game) => game.platform === 'Epic Games');

      setScanProgress({
        percentage: 100,
        steamGamesCount: steamGames.length,
        epicGamesCount: epicGames.length,
      });
      setFoundGames(games);

      setTimeout(() => {
        setIsScanning(false);
        setShowFoundGames(true);
      }, 500);
    } catch (error) {
      console.error('Error scanning games:', error);
      setIsScanning(false);
    } finally {
      clearInterval(progressInterval);
    }
  }, [setFoundGames]);

  const addGameToLibrary = useCallback(async (game: Game) => {
    try {
      await addFoundGameToLibrary(game);
    } catch (error) {
      console.error('Failed to import game:', error);
      throw error;
    }
  }, [addFoundGameToLibrary]);

  const addAllNewGames = useCallback(async (existingGames: Game[]) => {
    const newGames = foundGames.filter(
      (game) => !existingGames.some((g) => g.title === game.title)
    );
    
    for (const game of newGames) {
      await addGameToLibrary(game);
    }
  }, [foundGames, addGameToLibrary]);

  return {
    isScanning,
    scanProgress,
    showFoundGames,
    foundGames,
    startScan,
    addGameToLibrary,
    addAllNewGames,
    setShowFoundGames,
  };
};