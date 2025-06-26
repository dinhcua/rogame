import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { SaveFile } from './useGameDetail';

export interface BackupResponse {
  save_file: SaveFile;
  backup_time: number;
  save_count: number;
}

export interface BackupSettings {
  auto_backup: boolean;
  backup_interval: string;
  max_backups: number;
  compression_enabled: boolean;
}

export const useBackup = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backupSave = useCallback(async (gameId: string): Promise<BackupResponse | null> => {
    try {
      setIsBackingUp(true);
      setError(null);
      const response = await invoke<BackupResponse>('backup_save', { gameId });
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Backup failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsBackingUp(false);
    }
  }, []);

  const restoreSave = useCallback(async (gameId: string, saveId: string): Promise<SaveFile | null> => {
    try {
      setIsRestoring(true);
      setError(null);
      const response = await invoke<SaveFile>('restore_save', { gameId, saveId });
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Restore failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsRestoring(false);
    }
  }, []);

  const deleteSaveFile = useCallback(async (gameId: string, saveId: string): Promise<void> => {
    try {
      setError(null);
      await invoke('delete_save_file', { gameId, saveId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const loadBackupSettings = useCallback(async (): Promise<BackupSettings> => {
    try {
      const settings = await invoke<BackupSettings>('load_backup_settings');
      return settings;
    } catch (err) {
      console.error('Failed to load backup settings:', err);
      return {
        auto_backup: true,
        backup_interval: '30min',
        max_backups: 5,
        compression_enabled: true,
      };
    }
  }, []);

  const saveBackupSettings = useCallback(async (settings: BackupSettings): Promise<void> => {
    try {
      await invoke('save_backup_settings', { settings });
    } catch (err) {
      console.error('Failed to save backup settings:', err);
      throw err;
    }
  }, []);

  return {
    isBackingUp,
    isRestoring,
    error,
    backupSave,
    restoreSave,
    deleteSaveFile,
    loadBackupSettings,
    saveBackupSettings,
  };
};