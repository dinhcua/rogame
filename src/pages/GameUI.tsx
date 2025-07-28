import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Game } from "../types/game";
import AddGameModal from "../components/AddGameModal";
import DeleteGameModal from "../components/DeleteGameModal";
import DropdownSelect from "../components/DropdownSelect";
import PlatformIcon from "../components/PlatformIcon";
import { invoke } from "@tauri-apps/api/core";
import useGameStore from "../store/gameStore";
import { useToast } from "../hooks/useToast";
import {
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Plus,
  CheckCircle2,
  CheckCircle,
  ChevronDown,
  File,
  X,
  Loader2,
  Download,
  Trash2,
} from "lucide-react";
import "../i18n/config";

// Categories for filtering with their corresponding internal values
const CATEGORY_MAPPING = {
  "gameUI.categories.allGames": "all",
  "gameUI.categories.recentlyPlayed": "recent",
  "gameUI.categories.favorites": "favorites",
  "gameUI.categories.actionRPG": "Action RPG",
  "gameUI.categories.rpg": "RPG",
  "gameUI.categories.strategy": "Strategy",
  "gameUI.categories.action": "Action",
  "gameUI.categories.adventure": "Adventure",
  "gameUI.categories.jrpg": "JRPG",
  "gameUI.categories.survivalHorror": "Survival Horror",
} as const;

// Categories for filtering
const gameCategories = Object.keys(CATEGORY_MAPPING);

// Platform options
const getPlatformOptions = (t: any) => [
  { value: "All Platforms", label: t("gameUI.platforms.all") },
  { value: "Steam", label: t("gameUI.platforms.steam") },
  { value: "Epic Games", label: t("gameUI.platforms.epic") },
  { value: "GOG", label: t("gameUI.platforms.gog") },
  { value: "Origin", label: t("gameUI.platforms.origin") },
];

// Sort options
const getSortOptions = (t: any) => [
  { value: "name", label: t("gameUI.sort.byName") },
  { value: "last_played", label: t("gameUI.sort.byLastPlayed") },
  { value: "save_count", label: t("gameUI.sort.bySaveCount") },
  { value: "size", label: t("gameUI.sort.bySize") },
];

const GameUI = () => {
  const { t } = useTranslation();
  const { success, error: showError } = useToast();

  const {
    games,
    foundGames,
    setFoundGames,
    addFoundGameToLibrary,
    loadGames,
    deleteGame,
    toggleFavorite,
    updateGame,
  } = useGameStore();

  const [showScanProgress, setShowScanProgress] = useState(false);
  const [scanPercentage, setScanPercentage] = useState(0);
  const [steamGamesCount, setSteamGamesCount] = useState(0);
  const [epicGamesCount, setEpicGamesCount] = useState(0);
  const [showFoundGames, setShowFoundGames] = useState(false);
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [includeSaveFiles, setIncludeSaveFiles] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("All Platforms");
  const [selectedCategory, setSelectedCategory] = useState(
    "gameUI.categories.allGames"
  );
  const [sortBy, setSortBy] = useState("name");
  const [showMoreCategories, setShowMoreCategories] = useState(false);

  const platformOptions = getPlatformOptions(t);
  const sortOptions = getSortOptions(t);

  // Apply filters and sort to games
  const filteredGames = games
    .filter((game: Game) => {
      const matchesSearch = game.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesPlatform =
        selectedPlatform === "All Platforms" ||
        game.platform === selectedPlatform;

      // Get the internal category value
      const selectedInternalCategory =
        CATEGORY_MAPPING[selectedCategory as keyof typeof CATEGORY_MAPPING];

      // Updated category filtering logic using internal values
      const matchesCategory =
        selectedInternalCategory === "all" ||
        (selectedInternalCategory === "recent" &&
          game.last_played !== "Just added") ||
        (selectedInternalCategory === "favorites" && game.is_favorite) ||
        game.category === selectedInternalCategory;

      return matchesSearch && matchesPlatform && matchesCategory;
    })
    .sort((a: Game, b: Game) => {
      switch (sortBy) {
        case "name":
          return a.title.localeCompare(b.title);
        case "last_played":
          return a.last_played.localeCompare(b.last_played);
        case "save_count":
          return b.save_count - a.save_count;
        case "size":
          return parseInt(b.size) - parseInt(a.size);
        default:
          return 0;
      }
    });

  // Function to fetch backup count for a game
  const fetchBackupCount = async (game: Game) => {
    try {
      const saveFiles = await invoke<any[]>("list_saves", {
        gameId: game.id,
      });

      // Update the game with the actual backup count
      if (game.save_count !== saveFiles.length) {
        updateGame({
          ...game,
          save_count: saveFiles.length,
        });
      }
    } catch (error) {
      console.error(`Failed to fetch backup count for ${game.title}:`, error);
    }
  };

  // Load games and their backup counts
  useEffect(() => {
    const initializeGames = async () => {
      await loadGames();
    };

    initializeGames();
  }, []); // Run once when component mounts

  // Update backup counts whenever games change
  useEffect(() => {
    if (games.length > 0) {
      games.forEach((game) => {
        fetchBackupCount(game);
      });
    }
  }, [games]); // Run when games array changes

  const handleScan = () => {
    setShowScanProgress(true);
    setShowFoundGames(false);
    setScanPercentage(0);
    setSteamGamesCount(0);
    setEpicGamesCount(0);

    // Simulate scanning progress
    const progressInterval = setInterval(() => {
      setScanPercentage((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    invoke<Record<string, Game>>("scan_games")
      .then(async (result) => {
        const games = Object.values(result);

        // Count games by platform
        const steamGames = games.filter((game) => game.platform === "Steam");
        const epicGames = games.filter(
          (game) => game.platform === "Epic Games"
        );

        setSteamGamesCount(steamGames.length);
        setEpicGamesCount(epicGames.length);

        // Store found games without adding to database
        setFoundGames(games);

        // Don't reload from database - just show the found games

        // Ensure we reach 100%
        setScanPercentage(100);
        clearInterval(progressInterval);

        setTimeout(() => {
          setShowScanProgress(false);
          setShowFoundGames(true);
          success(t("gameUI.success.scanComplete", { count: games.length }));
        }, 500);
      })
      .catch((error) => {
        console.error("Error scanning games:", error);
        clearInterval(progressInterval);
        setShowScanProgress(false);
        showError(
          t("gameUI.errors.scanFailed", {
            error: error.message || "Unknown error",
          })
        );
      });
  };

  const addGameToLibrary = async (gameId: string) => {
    try {
      await addFoundGameToLibrary(gameId);
      const game = foundGames.find((g) => g.id === gameId);
      if (game) {
        success(t("gameUI.success.gameAdded", { title: game.title }));
      }
    } catch (error) {
      console.error("Failed to add game:", error);
      showError(t("gameUI.errors.addGameFailed"));
    }
  };

  const handleDeleteGame = async () => {
    if (!gameToDelete) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);

      console.log("Deleting game:", {
        id: gameToDelete.id,
        title: gameToDelete.title,
        includeSaveFiles,
      });

      await deleteGame(gameToDelete.id, includeSaveFiles);
      setShowDeleteModal(false);
      success(t("gameUI.success.gameDeleted", { title: gameToDelete.title }));
      setGameToDelete(null);
      setIncludeSaveFiles(false);
    } catch (error) {
      console.error("Failed to delete game:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete game";
      setDeleteError(errorMessage);
      showError(t("gameUI.errors.deleteFailed", { error: errorMessage }));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="text-white font-sans animate-fade-in p-8">
      {/* Main Content */}
      <div>
        {/* Header Section */}
        <div className="mb-3">
          <h1 className="text-2xl font-bold">{t("gameUI.title")}</h1>
          <p className="text-gray-400">{t("gameUI.subtitle")}</p>
        </div>

        {/* Game Scanner Section */}
        <div className="bg-gradient-to-r from-rog-blue/10 to-purple-600/10 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-rog-blue/20 rounded-xl flex items-center justify-center">
                <Search className="w-8 h-8 text-rog-blue" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {t("gameUI.scanner.title")}
                </h2>
                <p className="text-gray-400 text-sm">
                  {t("gameUI.scanner.description")}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleScan}
                className="bg-rog-blue px-6 py-2 rounded-lg hover:bg-epic-accent transition-all duration-200 flex items-center space-x-2 font-medium"
              >
                <Search className="w-5 h-5" />
                <span>{t("gameUI.scanner.scanButton")}</span>
              </button>
            </div>
          </div>

          {/* Scan Progress */}
          {showScanProgress && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">
                  {t("gameUI.scanner.scanning")}
                </span>
                <span className="text-sm text-gray-400">{scanPercentage}%</span>
              </div>
              <div className="w-full bg-epic-hover rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-rog-blue to-purple-600 h-3 rounded-full transition-all duration-300 relative"
                  style={{ width: `${scanPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center space-x-3 text-green-500">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm">
                    {t("gameUI.scanner.steamFound", { count: steamGamesCount })}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-green-500">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm">
                    {t("gameUI.scanner.epicFound", { count: epicGamesCount })}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">
                    {t("gameUI.scanner.scanningGog")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Recently Found Games */}
          {showFoundGames && foundGames.length > 0 && (
            <div className="mt-6 bg-game-dark/50 backdrop-blur-sm rounded-lg p-4 border border-epic-border/50 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {t("gameUI.foundGames.title")}
                  </h3>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Found {foundGames.length} games ready to import
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      try {
                        for (const game of foundGames) {
                          await addGameToLibrary(game.id);
                        }
                        success(
                          t("gameUI.success.allGamesImported", {
                            count: foundGames.length,
                          })
                        );
                      } catch (error) {
                        console.error("Failed to import all games:", error);
                        showError(t("gameUI.errors.importAllFailed"));
                      }
                    }}
                    className="bg-rog-blue px-4 py-2 rounded hover:bg-epic-accent transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-lg hover:shadow-rog-blue/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t("gameUI.foundGames.importAll")}</span>
                  </button>
                  <button
                    onClick={() => setShowFoundGames(false)}
                    className="p-1.5 rounded hover:bg-epic-hover transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {foundGames.map((game) => {
                  const isInLibrary = games.some((g) => g.id === game.id);
                  return (
                    <div
                      key={game.id}
                      className="bg-game-card/80 backdrop-blur-sm rounded p-3 hover:bg-game-card transition-all duration-200 group shadow-lg hover:shadow-xl"
                    >
                      <div className="flex gap-3">
                        <div className="relative w-16 h-20 flex-shrink-0 overflow-hidden rounded">
                          <img
                            src={game.cover_image}
                            alt={game.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-white truncate mb-1">
                            {game.title}
                          </h4>
                          <div className="flex items-center gap-1 mb-2">
                            <PlatformIcon
                              platform={game.platform}
                              className="w-3 h-3 brightness-0 invert"
                            />
                            <p className="text-xs text-gray-400">
                              {game.platform}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              !isInLibrary && addGameToLibrary(game.id)
                            }
                            className={`${
                              isInLibrary
                                ? "bg-epic-success/20 text-epic-success border border-epic-success/30"
                                : "bg-rog-blue text-white hover:bg-epic-accent"
                            } px-3 py-1 rounded transition-all duration-200 text-xs font-medium w-full`}
                            disabled={isInLibrary}
                          >
                            {isInLibrary ? (
                              <span className="flex items-center justify-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                {t("gameUI.foundGames.added")}
                              </span>
                            ) : (
                              t("gameUI.foundGames.addToLibrary")
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Filters and Search */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder={t("gameUI.filters.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-epic-hover rounded-lg pl-10 pr-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-rog-blue focus:border-transparent transition-all duration-200"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
            <DropdownSelect
              options={platformOptions}
              value={selectedPlatform}
              onChange={setSelectedPlatform}
              placeholder={t("gameUI.filters.platform")}
              icon={<ShoppingBag className="w-5 h-5" />}
            />
            <DropdownSelect
              options={sortOptions}
              value={sortBy}
              onChange={setSortBy}
              placeholder={t("gameUI.filters.sortBy")}
              icon={<SlidersHorizontal className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Game Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {gameCategories
            .slice(0, showMoreCategories ? undefined : 6)
            .map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`${
                  selectedCategory === category
                    ? "bg-rog-blue text-white"
                    : "bg-epic-hover hover:bg-epic-hover/80 text-gray-300 hover:text-white border border-epic-border"
                } px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap font-medium`}
              >
                {t(category)}
              </button>
            ))}
          {gameCategories.length > 6 && (
            <button
              onClick={() => setShowMoreCategories(!showMoreCategories)}
              className="bg-epic-hover hover:bg-epic-hover/80 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap flex items-center space-x-2 font-medium text-gray-300 hover:text-white"
            >
              <span>
                {showMoreCategories
                  ? t("gameUI.categories.less")
                  : t("gameUI.categories.more")}
              </span>
              <ChevronDown
                className={`w-4 h-4 transform transition-transform ${
                  showMoreCategories ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredGames.map((game) => (
            <div key={game.id} className="relative group">
              <a
                href={`/game/${game.id}`}
                className="block bg-game-card rounded-lg overflow-hidden transition-all duration-200 hover:shadow-lg"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={game.cover_image}
                    alt={game.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-2 right-2 flex items-center space-x-1 z-10">
                    <span
                      className={`${
                        game.status === "synced"
                          ? "bg-epic-success/90 backdrop-blur-sm"
                          : "bg-epic-warning/90 backdrop-blur-sm"
                      } text-white p-1.25 rounded text-xs font-medium shadow-lg`}
                    >
                      {game.status === "synced"
                        ? t("gameUI.status.synced")
                        : t("gameUI.status.syncing")}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(game.id)
                          .then(() => {
                            if (game.is_favorite) {
                              success(
                                t("gameUI.success.removedFromFavorites", {
                                  title: game.title,
                                })
                              );
                            } else {
                              success(
                                t("gameUI.success.addedToFavorites", {
                                  title: game.title,
                                })
                              );
                            }
                          })
                          .catch((error) => {
                            console.error("Failed to toggle favorite:", error);
                            showError(t("gameUI.errors.toggleFavoriteFailed"));
                          });
                      }}
                      className={`bg-black/60 backdrop-blur-sm p-1.5 rounded hover:bg-black/80 transition-all duration-200 ${
                        game.is_favorite
                          ? "text-epic-warning"
                          : "text-white/80 hover:text-white"
                      } shadow-lg`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          game.is_favorite ? "fill-current" : ""
                        }`}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setGameToDelete(game);
                        setShowDeleteModal(true);
                      }}
                      className="bg-black/60 backdrop-blur-sm p-1.5 rounded hover:bg-epic-danger/80 transition-all duration-200 text-white/80 hover:text-white shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/90 to-transparent">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white group-hover:text-rog-blue transition-colors line-clamp-1">
                      {game.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <PlatformIcon
                          platform={game.platform}
                          className="w-3 h-3 brightness-0 invert opacity-70"
                        />
                        <span className="text-xs text-gray-300">
                          {game.platform}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-300">
                        <File className="w-3 h-3" />
                        <span className="text-xs font-medium">
                          {game.save_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          ))}

          {/* Add Game Card */}
          <div
            onClick={() => setShowAddGameModal(true)}
            className="bg-game-card rounded-lg overflow-hidden border border-dashed border-gray-600 flex items-center justify-center aspect-[3/4] cursor-pointer hover:border-rog-blue hover:bg-epic-hover transition-all duration-200 group"
          >
            <div className="text-center p-2">
              <div className="w-14 h-14 rounded-full bg-epic-hover flex items-center justify-center mx-auto mb-3 group-hover:bg-rog-blue/20 transition-all duration-300">
                <Plus className="w-7 h-7 text-gray-400 group-hover:text-rog-blue transition-colors" />
              </div>
              <h3 className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">
                {t("gameUI.addGame.title")}
              </h3>
              <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-300 transition-colors">
                {t("gameUI.addGame.description")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Game Modal */}
      <AddGameModal
        isOpen={showAddGameModal}
        onClose={() => setShowAddGameModal(false)}
        onAdd={async (gameData) => {
          try {
            // TODO: Implement adding game to library
            console.log("Adding game:", gameData);
            success(t("gameUI.success.gameAddedManually"));
          } catch (error) {
            console.error("Failed to add game:", error);
            showError(t("gameUI.errors.addGameFailed"));
          }
        }}
      />

      {/* Delete Game Modal */}
      <DeleteGameModal
        isOpen={showDeleteModal}
        onClose={() => {
          if (!isDeleting) {
            setShowDeleteModal(false);
            setGameToDelete(null);
            setIncludeSaveFiles(false);
            setDeleteError(null);
          }
        }}
        onDelete={handleDeleteGame}
        gameTitle={gameToDelete?.title || ""}
        includeSaveFiles={includeSaveFiles}
        setIncludeSaveFiles={setIncludeSaveFiles}
        isDeleting={isDeleting}
        error={deleteError}
      />
    </div>
  );
};

export default GameUI;
