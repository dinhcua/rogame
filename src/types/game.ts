export interface Game {
  id: string;
  title: string;
  cover_image: string;
  platform: string;
  last_played: string;
  save_count: number;
  size: string;
  status: "has_saves" | "no_saves" | "added" | "synced" | "syncing";
  category: string;
  is_favorite: boolean;
  save_location: string;
  backup_location?: string; // Optional backup location
  last_backup_time?: number | null; // Optional since not all games have backups
}