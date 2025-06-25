import { create } from "zustand";
import { Game } from "../types/game";
import { invoke } from "@tauri-apps/api/core";

interface GameStore {
  games: Game[];
  foundGames: Game[];
  setFoundGames: (games: Game[]) => void;
  addFoundGameToLibrary: (game: Game) => Promise<void>;
  loadGames: () => Promise<void>;
  deleteGame: (
    gameId: string,
    gameTitle: string,
    includeSaveFiles: boolean
  ) => Promise<void>;
  toggleFavorite: (gameId: string) => Promise<void>;
  updateGame: (game: Game) => void;
}

const useGameStore = create<GameStore>((set, get) => ({
  games: [],
  foundGames: [],
  setFoundGames: (games) => set({ foundGames: games }),
  addFoundGameToLibrary: async (game: Game) => {
    try {
      const importedGame = await invoke<Game>("import_game", { game });
      set((state) => ({
        games: [...state.games, importedGame],
        foundGames: state.foundGames,
      }));
    } catch (error) {
      console.error("Failed to add game to library:", error);
      throw error;
    }
  },
  loadGames: async () => {
    try {
      const games = await invoke<Record<string, Game>>("scan_installed_games");
      set({ games: Object.values(games) });
    } catch (error) {
      console.error("Failed to load games:", error);
      throw error;
    }
  },
  deleteGame: async (gameId, gameTitle, includeSaveFiles) => {
    try {
      if (includeSaveFiles) {
        await invoke("delete_game_saves", { gameId: gameTitle });
      }
      await invoke("delete_game", { gameId });
      set((state) => ({
        games: state.games.filter((g) => g.id !== gameId),
      }));
    } catch (error) {
      console.error("Failed to delete game:", error);
      throw error;
    }
  },
  toggleFavorite: async (gameId) => {
    try {
      await invoke("toggle_favorite", { gameId });
      set((state) => ({
        games: state.games.map((g) =>
          g.id === gameId ? { ...g, is_favorite: !g.is_favorite } : g
        ),
      }));
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      throw error;
    }
  },
  updateGame: (game) => {
    set((state) => ({
      games: state.games.map((g) => (g.id === game.id ? game : g)),
    }));
  },
}));

export default useGameStore;
