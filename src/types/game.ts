export interface Game {
  id: string;
  title: string;
  coverImage: string;
  platform: string;
  lastPlayed: string;
  saveCount: number;
  size: string;
  status: "synced" | "syncing" | "added";
  category: string;
  isFavorite: boolean;
}
