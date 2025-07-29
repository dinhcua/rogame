import { create } from "zustand";
import { Game } from "../types/game";
import { invoke } from "@tauri-apps/api/core";

// Interface for our store state
interface GameState {
  games: Game[];
  foundGames: Game[];
  isLoading: boolean;
  error: string | null;
  setGames: (games: Game[]) => void;
  addGame: (game: Game) => Promise<void>;
  loadGames: () => Promise<void>;
  updateGame: (game: Game) => Promise<void>;
  removeGame: (gameId: string) => Promise<void>;
  setFoundGames: (games: Game[]) => void;
  addFoundGameToLibrary: (gameId: string) => Promise<void>;
  deleteGame: (gameId: string, includeSaveFiles: boolean) => Promise<void>;
  toggleFavorite: (gameId: string) => Promise<void>;
}

// Create the store
const useGameStore = create<GameState>((set, get) => ({
  games: [],
  foundGames: [],
  isLoading: false,
  error: null,

  setGames: (games) => set({ games }),

  loadGames: async () => {
    try {
      set({ isLoading: true, error: null });
      // Use Rust backend to get all games
      const games = await invoke<Game[]>("get_all_games");
      set({ games, isLoading: false });
    } catch (error) {
      console.error("Failed to load games:", error);
      set({ error: "Failed to load games", isLoading: false });
    }
  },

  addGame: async (game) => {
    try {
      console.log(game);

      // Ensure proper structure for Rust backend
      const gameForRust = {
        id: game.id,
        title: game.title,
        cover_image: game.cover_image,
        platform: game.platform,
        last_played: game.last_played,
        save_count: game.save_count,
        size: game.size,
        status: game.status,
        category: game.category,
        is_favorite: game.is_favorite,
        save_location:
          (game as any).save_location ||
          (game as any).save_locations?.[0]?.path ||
          "",
        backup_location: game.backup_location || null,
        last_backup_time: game.last_backup_time || null,
      };

      // Use Rust backend to add a game
      await invoke("add_game", { game: gameForRust });
      const games = [...get().games, game];
      set({ games });
    } catch (error) {
      console.error("Failed to add game:", error);
      throw error;
    }
  },

  updateGame: async (updatedGame) => {
    try {
      // Use Rust backend to update a game
      await invoke("update_game", { game: updatedGame });
      const games = get().games.map((game) =>
        game.id === updatedGame.id ? updatedGame : game
      );
      set({ games });
    } catch (error) {
      set({ error: "Failed to update game" });
      throw error;
    }
  },

  removeGame: async (gameId) => {
    try {
      // Use Rust backend to delete a game
      await invoke("delete_game", { id: gameId });
      const games = get().games.filter((game) => game.id !== gameId);
      set({ games });
    } catch (error) {
      set({ error: "Failed to remove game" });
      throw error;
    }
  },

  setFoundGames: (games) => set({ foundGames: games }),

  addFoundGameToLibrary: async (gameId) => {
    const gameToAdd = get().foundGames.find((g) => g.id === gameId);
    if (!gameToAdd) return;

    try {
      // Use add_game_to_library command which handles save_locations properly
      await invoke("add_game_to_library", { gameInfo: gameToAdd });
      
      // Update local state
      const foundGames = get().foundGames.map((g) =>
        g.id === gameId ? { ...g, status: "added" as const } : g
      );
      set({ foundGames });
      
      // Reload games to get the updated data from database
      await get().loadGames();
    } catch (error) {
      console.error("Failed to add game to library:", error);
      throw error;
    }
  },

  deleteGame: async (gameId: string, includeSaveFiles: boolean) => {
    try {
      if (includeSaveFiles) {
        await invoke("delete_game_saves", { gameId: gameId });
      }

      // Delete from SQLite database
      await invoke("delete_game", { id: gameId });

      // Update state after successful deletion
      const games = get().games.filter((g) => g.id !== gameId);
      set({ games });

      // Update foundGames if the game exists there
      const foundGames = get().foundGames.map((g) => {
        if (g.id === gameId) {
          return { ...g, status: "not_synced" as const };
        }
        return g;
      });

      set({ foundGames });
    } catch (error) {
      console.error("Failed to delete game:", error);
      throw error; // Re-throw the error to be handled by the UI
    }
  },

  toggleFavorite: async (gameId) => {
    try {
      // Use Rust backend to toggle favorite status
      const updatedGame = await invoke<Game>("toggle_favorite", { id: gameId });

      // Update state with the returned game
      const games = get().games.map((g) => (g.id === gameId ? updatedGame : g));
      set({ games });
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      throw error;
    }
  },
}));

export default useGameStore;
