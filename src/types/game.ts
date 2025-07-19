export interface Game {
  id: string;
  title: string;
  cover_image: string;
  platform: string;
  last_played: string;
  last_backup_time: number | null; // Unix timestamp in milliseconds
  save_count: number;
  size: string;
  status: "added" | "synced" | "syncing" | "not_synced";
  category: string;
  is_favorite: boolean;
  save_location: string;
  backup_location: string | null;
  save_locations?: SaveLocation[];
}

export interface SaveLocation {
  path: string;
  file_count: number;
  total_size: string;
  last_modified: string;
}
