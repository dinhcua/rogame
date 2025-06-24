import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Game } from "../types/game";
import AddGameModal from "../components/AddGameModal";
import DeleteGameModal from "../components/DeleteGameModal";
import DropdownSelect from "../components/DropdownSelect";
import PlatformIcon from "../components/PlatformIcon";
import { invoke } from "@tauri-apps/api/core";
import useGameStore from "../store/gameStore";
import {
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Clock,
  Star,
  Plus,
  CheckCircle2,
  ChevronDown,
  File,
  Scale,
  X,
  Loader2,
  FileText,
  Download,
  Check,
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

  const {
    games,
    foundGames,
    setFoundGames,
    addFoundGameToLibrary,
    loadGames,
    deleteGame,
    toggleFavorite,
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

  useEffect(() => {
    // Load games from IndexedDB
    loadGames();
  }, []);

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
      .then((result) => {
        const games = Object.values(result);

        // Count games by platform
        const steamGames = games.filter((game) => game.platform === "Steam");
        const epicGames = games.filter(
          (game) => game.platform === "Epic Games"
        );

        setSteamGamesCount(steamGames.length);
        setEpicGamesCount(epicGames.length);
        setFoundGames(games);

        // Ensure we reach 100%
        setScanPercentage(100);
        clearInterval(progressInterval);

        setTimeout(() => {
          setShowScanProgress(false);
          setShowFoundGames(true);
        }, 500);
      })
      .catch((error) => {
        console.error("Error scanning games:", error);
        clearInterval(progressInterval);
        setShowScanProgress(false);
      });
  };

  const addGameToLibrary = async (gameId: string) => {
    await addFoundGameToLibrary(gameId);
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

      await deleteGame(gameToDelete.id, gameToDelete.title, includeSaveFiles);
      setShowDeleteModal(false);
      setGameToDelete(null);
      setIncludeSaveFiles(false);
    } catch (error) {
      console.error("Failed to delete game:", error);
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete game"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-game-dark text-white font-sans">
      {/* Main Content */}
      <div>
        {/* Game Scanner Section */}
        <div className="bg-game-card rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-medium mb-2">
                {t("gameUI.scanner.title")}
              </h2>
              <p className="text-gray-400">{t("gameUI.scanner.description")}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleScan}
                className="bg-rog-blue px-6 py-2.5 rounded-lg hover:bg-blue-500 transition-colors flex items-center space-x-2"
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
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-rog-blue h-2 rounded-full transition-all duration-300"
                  style={{ width: `${scanPercentage}%` }}
                />
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
            <div className="mt-6 border-t border-white/10 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">
                  {t("gameUI.foundGames.title")}
                </h3>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() =>
                      foundGames.forEach((game) => addGameToLibrary(game.id))
                    }
                    className="bg-rog-blue px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>{t("gameUI.foundGames.importAll")}</span>
                  </button>
                  <button
                    onClick={() => setShowFoundGames(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {foundGames.map((game) => {
                  const isInLibrary = games.some((g) => g.id === game.id);
                  return (
                    <div
                      key={game.id}
                      className="bg-black/20 rounded-lg p-4 flex items-center space-x-3"
                    >
                      <img
                        src={game.cover_image}
                        alt={game.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{game.title}</h4>
                        <p className="text-sm text-gray-400">{game.platform}</p>
                      </div>
                      <button
                        onClick={() =>
                          !isInLibrary && addGameToLibrary(game.id)
                        }
                        className={`${
                          isInLibrary
                            ? "bg-green-500/20 text-green-500 cursor-default"
                            : "bg-rog-blue/20 hover:bg-rog-blue/30 text-rog-blue"
                        } p-2 rounded-lg transition-colors group relative`}
                        disabled={isInLibrary}
                      >
                        {isInLibrary ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        )}
                        <span className="absolute bg-black/90 text-white text-xs px-2 py-1 rounded -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {isInLibrary
                            ? t("gameUI.foundGames.added")
                            : t("gameUI.foundGames.addToLibrary")}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Filters and Search */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder={t("gameUI.filters.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/10 rounded-lg pl-10 pr-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-rog-blue"
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
        <div className="flex flex-wrap gap-4 mb-8">
          {gameCategories
            .slice(0, showMoreCategories ? undefined : 6)
            .map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`${
                  selectedCategory === category
                    ? "bg-rog-blue"
                    : "bg-white/10 hover:bg-white/20"
                } px-4 py-2 rounded-lg transition-colors whitespace-nowrap`}
              >
                {t(category)}
              </button>
            ))}
          {gameCategories.length > 6 && (
            <button
              onClick={() => setShowMoreCategories(!showMoreCategories)}
              className="bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors whitespace-nowrap flex items-center space-x-1"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.map((game) => (
            <div key={game.id} className="relative group">
              <a
                href={`/game/${game.id}`}
                className="block bg-game-card h-[320px] rounded-lg overflow-hidden group hover:ring-2 hover:ring-rog-blue transition-all"
              >
                <div className="relative">
                  <img
                    src={game.cover_image}
                    alt={game.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 right-3 flex items-center space-x-2">
                    <span
                      className={`${
                        game.status === "synced"
                          ? "bg-green-500/90"
                          : "bg-yellow-500/90"
                      } text-white px-2 py-1 rounded text-sm`}
                    >
                      {game.status === "synced"
                        ? t("gameUI.status.synced")
                        : t("gameUI.status.syncing")}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(game.id).catch(console.error);
                      }}
                      className={`bg-black/50 p-1.5 rounded-lg hover:bg-black/70 transition-colors ${
                        game.is_favorite ? "text-yellow-500" : "text-white"
                      }`}
                    >
                      <Star
                        className={`w-5 h-5 ${
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
                      className="bg-black/50 p-1.5 rounded-lg hover:bg-red-500/70 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium group-hover:text-rog-blue transition-colors">
                      {game.title}
                    </h3>
                    <div className="flex items-center space-x-1 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{game.last_played}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <PlatformIcon
                      platform={game.platform}
                      className="w-5 h-5 brightness-0 invert opacity-70"
                    />
                    <span className="text-sm text-gray-400">
                      {game.platform}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <File className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">
                        {t("gameUI.saveCount", { count: game.save_count })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Scale className="w-5 h-5 text-gray-400" />
                      <span className="text-sm">{game.size}</span>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          ))}

          {/* Add Game Card */}
          <div
            onClick={() => setShowAddGameModal(true)}
            className="bg-game-card rounded-lg overflow-hidden border-2 border-dashed border-white/20 flex items-center justify-center h-[320px] cursor-pointer hover:border-rog-blue transition-colors group"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-rog-blue/20 transition-colors">
                <Plus className="w-8 h-8 text-white/70 group-hover:text-rog-blue transition-colors" />
              </div>
              <h3 className="text-lg font-medium text-white/70 group-hover:text-white transition-colors">
                {t("gameUI.addGame.title")}
              </h3>
              <p className="text-sm text-white/50 mt-2 max-w-[200px]">
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
        onAdd={(gameData) => {
          // TODO: Implement adding game to library
          console.log("Adding game:", gameData);
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
