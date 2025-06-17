export interface Game {
  id: string;
  title: string;
  cover_image: string;
  platform: string;
  last_played: string;
  save_count: number;
  size: string;
  status: "synced" | "syncing" | "added";
  category: string;
  is_favorite: boolean;
}
