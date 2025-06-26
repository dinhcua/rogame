import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Game } from '../types/game';
import useGameStore from '../store/gameStore';

export const useGames = () => {
  const {
    games,
    loadGames,
    deleteGame,
    toggleFavorite,
    updateGame,
  } = useGameStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeGames = async () => {
      setIsLoading(true);
      try {
        await loadGames();
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load games');
      } finally {
        setIsLoading(false);
      }
    };

    initializeGames();
  }, [loadGames]);

  const fetchBackupCount = async (game: Game) => {
    try {
      const saveFiles = await invoke<any[]>('list_saves', {
        gameId: game.title,
      });

      if (game.save_count !== saveFiles.length) {
        const updatedGame: Game = {
          ...game,
          save_count: saveFiles.length,
          status: saveFiles.length > 0 ? 'has_saves' : 'no_saves',
        };
        updateGame(updatedGame);
      }
    } catch (error) {
      console.error(`Failed to fetch backup count for ${game.title}:`, error);
    }
  };

  useEffect(() => {
    if (games.length > 0) {
      games.forEach(fetchBackupCount);
    }
  }, [games]);

  return {
    games,
    isLoading,
    error,
    deleteGame,
    toggleFavorite,
    updateGame,
    refetchBackupCounts: () => games.forEach(fetchBackupCount),
  };
};