export const PLATFORMS = {
  ALL: 'All Platforms',
  STEAM: 'Steam',
  EPIC: 'Epic Games',
  GOG: 'GOG',
  ORIGIN: 'Origin',
} as const;

export const SORT_OPTIONS = {
  NAME: 'name',
  LAST_PLAYED: 'last_played',
  SAVE_COUNT: 'save_count',
  SIZE: 'size',
} as const;

export const GAME_STATUS = {
  HAS_SAVES: 'has_saves',
  NO_SAVES: 'no_saves',
  ADDED: 'added',
  SYNCED: 'synced',
  SYNCING: 'syncing',
} as const;

export const BACKUP_INTERVALS = {
  '5min': 5 * 60 * 1000,
  '15min': 15 * 60 * 1000,
  '30min': 30 * 60 * 1000,
  '1hour': 60 * 60 * 1000,
  '3hours': 3 * 60 * 60 * 1000,
} as const;