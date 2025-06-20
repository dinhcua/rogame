export interface Game {
  id: string;
  title: string;
  cover_image: string;
  platform: string;
  last_played: string;
  save_count: number;
  size: string;
  status: "added" | "synced" | "syncing" | "not_synced";
  category: string;
  is_favorite: boolean;
  save_locations?: SaveLocation[];
}

export interface SaveLocation {
  path: string;
  file_count: number;
  total_size: string;
  last_modified: string;
}
