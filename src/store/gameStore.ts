import { create } from "zustand";
import { Game } from "../types/game";
import { openDB } from "idb";
import { invoke } from "@tauri-apps/api/core";

const DB_NAME = "rogame-db";
const STORE_NAME = "games";

// Initialize the database
const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      // Create the games object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    },
  });
};

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
  deleteGame: (
    gameId: string,
    gameTitle: string,
    includeSaveFiles: boolean
  ) => Promise<void>;
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
      const db = await initDB();
      const games = await db.getAll(STORE_NAME);
      set({ games, isLoading: false });
    } catch (error) {
      console.error("Failed to load games:", error);
      set({ error: "Failed to load games", isLoading: false });
    }
  },

  addGame: async (game) => {
    try {
      const db = await initDB();
      await db.put(STORE_NAME, game);
      const games = [...get().games, game];
      set({ games });
    } catch (error) {
      console.error("Failed to add game:", error);
      throw error;
    }
  },

  updateGame: async (updatedGame) => {
    try {
      const db = await initDB();
      await db.put(STORE_NAME, updatedGame);
      const games = get().games.map((game) =>
        game.id === updatedGame.id ? updatedGame : game
      );
      set({ games });
    } catch (error) {
      set({ error: "Failed to update game" });
    }
  },

  removeGame: async (gameId) => {
    try {
      const db = await initDB();
      await db.delete(STORE_NAME, gameId);
      const games = get().games.filter((game) => game.id !== gameId);
      set({ games });
    } catch (error) {
      set({ error: "Failed to remove game" });
    }
  },

  setFoundGames: (games) => set({ foundGames: games }),

  addFoundGameToLibrary: async (gameId) => {
    const gameToAdd = get().foundGames.find((g) => g.id === gameId);
    if (!gameToAdd) return;

    try {
      await get().addGame(gameToAdd);
      const foundGames = get().foundGames.map((g) =>
        g.id === gameId ? { ...g, status: "added" as const } : g
      );
      set({ foundGames });
    } catch (error) {
      console.error("Failed to add game to library:", error);
      throw error;
    }
  },

  deleteGame: async (
    gameId: string,
    gameTitle: string,
    includeSaveFiles: boolean
  ) => {
    try {
      if (includeSaveFiles) {
        await invoke("delete_game_saves", { gameId: gameTitle });
      }

      // Then delete from IndexedDB
      const db = await initDB();
      await db.delete(STORE_NAME, gameId);

      // Update state after successful deletion
      const games = get().games.filter((g) => g.id !== gameId);
      set({ games });

      // If the game was in foundGames, remove it from there too
      const foundGames = get().foundGames.filter((g) => g.id !== gameId);
      if (foundGames.length !== get().foundGames.length) {
        set({ foundGames });
      }
    } catch (error) {
      console.error("Failed to delete game:", error);
      throw error; // Re-throw the error to be handled by the UI
    }
  },

  toggleFavorite: async (gameId) => {
    try {
      const game = get().games.find((g) => g.id === gameId);
      if (!game) return;

      const updatedGame = { ...game, is_favorite: !game.is_favorite };
      await get().updateGame(updatedGame);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      throw error;
    }
  },
}));

export default useGameStore;
