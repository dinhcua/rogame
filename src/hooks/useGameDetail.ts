import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Game } from '../types/game';

export interface SaveFile {
  id: string;
  game_id: string;
  file_name: string;
  created_at: string;
  modified_at: string;
  size_bytes: number;
  tags: string[];
  save_location: string;
  backup_location: string;
}

export const useGameDetail = (gameId: string | undefined) => {
  const [gameDetails, setGameDetails] = useState<Game | null>(null);
  const [saveFiles, setSaveFiles] = useState<SaveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGameData = async () => {
      if (!gameId) return;

      try {
        setIsLoading(true);
        setError(null);

        const game = await invoke<Game>('get_game_detail', { gameId });

        if (game) {
          const files = await invoke<SaveFile[]>('list_saves', {
            gameId: game.title,
          });

          const updatedGame = {
            ...game,
            save_count: files.length,
          };

          setGameDetails(updatedGame);
          setSaveFiles(files);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load game details');
      } finally {
        setIsLoading(false);
      }
    };

    loadGameData();
  }, [gameId]);

  const refreshSaveFiles = async () => {
    if (!gameDetails) return;

    try {
      const files = await invoke<SaveFile[]>('list_saves', {
        gameId: gameDetails.title,
      });
      setSaveFiles(files);
      setGameDetails({
        ...gameDetails,
        save_count: files.length,
      });
    } catch (err) {
      console.error('Failed to refresh save files:', err);
    }
  };

  return {
    gameDetails,
    saveFiles,
    isLoading,
    error,
    refreshSaveFiles,
  };
};