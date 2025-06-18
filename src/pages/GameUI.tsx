import { useState, useEffect } from "react";
import { Game } from "../types/game";
import AddGameModal from "../components/AddGameModal";
import DropdownSelect from "../components/DropdownSelect";
import { invoke } from "@tauri-apps/api/core";
import {
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Clock,
  Star,
  Plus,
  CheckCircle2,
  LayoutGrid,
  Layout,
  ChevronDown,
  File,
  Scale,
  X,
  Loader2,
  FileText,
  Download,
  Check,
} from "lucide-react";

// Sample data
const sampleGames: Game[] = [
  {
    id: "game1",
    title: "Elden Ring",
    cover_image:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg",
    platform: "Steam",
    last_played: "Just added",
    save_count: 8,
    size: "128MB",
    status: "synced",
    category: "Action RPG",
    is_favorite: false,
  },
  {
    id: "game2",
    title: "Lies of P",
    cover_image:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1551360/header.jpg",
    platform: "Epic Games",
    last_played: "Just added",
    save_count: 3,
    size: "64MB",
    status: "syncing",
    category: "Action RPG",
    is_favorite: true,
  },
];

// Categories for filtering
const gameCategories = [
  "All Games",
  "Recently Played",
  "Favorites",
  "Action RPG",
  "RPG",
  "Strategy",
  "Action",
  "Adventure",
];

// Platform options
const platformOptions = [
  { value: "All Platforms", label: "All Platforms" },
  { value: "Steam", label: "Steam" },
  { value: "Epic Games", label: "Epic Games" },
  { value: "GOG", label: "GOG" },
  { value: "Origin", label: "Origin" },
];

// Sort options
const sortOptions = [
  { value: "name", label: "Sort by Name" },
  { value: "last_played", label: "Sort by Last Played" },
  { value: "save_count", label: "Sort by Save Count" },
  { value: "size", label: "Sort by Size" },
];

const GameUI = () => {
  const [showScanProgress, setShowScanProgress] = useState(false);
  const [scanPercentage, setScanPercentage] = useState(0);
  const [steamGamesCount, setSteamGamesCount] = useState(0);
  const [epicGamesCount, setEpicGamesCount] = useState(0);
  const [showFoundGames, setShowFoundGames] = useState(false);
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [gridView, setGridView] = useState<"3x3" | "4x4">("4x4");
  const [games, setGames] = useState<Game[]>(sampleGames);
  const [foundGames, setFoundGames] = useState<Game[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("All Platforms");
  const [selectedCategory, setSelectedCategory] = useState("All Games");
  const [sortBy, setSortBy] = useState("name");
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Apply filters and sort to games
  const filteredGames = games
    .filter((game) => {
      const matchesSearch = game.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesPlatform =
        selectedPlatform === "All Platforms" ||
        game.platform === selectedPlatform;
      const matchesCategory =
        selectedCategory === "All Games" ||
        (selectedCategory === "Recently Played" &&
          game.last_played !== "Just added") ||
        (selectedCategory === "Favorites" && game.is_favorite) ||
        game.category === selectedCategory;

      return matchesSearch && matchesPlatform && matchesCategory;
    })
    .sort((a, b) => {
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
    // Load grid view preference
    const savedView = localStorage.getItem("gridView") as "3x3" | "4x4";
    if (savedView) {
      setGridView(savedView);
    }
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

  const handleGridViewChange = (view: "3x3" | "4x4") => {
    setGridView(view);
    localStorage.setItem("gridView", view);
  };

  const addGameToLibrary = (gameId: string) => {
    const gameToAdd = foundGames.find((g) => g.id === gameId);
    if (!gameToAdd) return;

    setGames((prev) => [...prev, gameToAdd]);
    setFoundGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, status: "added" } : g))
    );
  };

  return (
    <div className="bg-game-dark text-white font-sans">
      {/* Main Content */}
      <div>
        {/* Game Scanner Section */}
        <div className="bg-game-card rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-medium mb-2">Game Scanner</h2>
              <p className="text-gray-400">
                Automatically detect and import games from your system
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleScan}
                className="bg-rog-blue px-6 py-2.5 rounded-lg hover:bg-blue-500 transition-colors flex items-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>Scan for Games</span>
              </button>
            </div>
          </div>

          {/* Scan Progress */}
          {showScanProgress && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">
                  Scanning game directories...
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
                    Steam Library: {steamGamesCount} games found
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-green-500">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm">
                    Epic Games: {epicGamesCount} games found
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Scanning GOG Galaxy...</span>
                </div>
              </div>
            </div>
          )}

          {/* Recently Found Games */}
          {showFoundGames && foundGames.length > 0 && (
            <div className="mt-6 border-t border-white/10 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Recently Found Games</h3>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() =>
                      foundGames.forEach((game) => addGameToLibrary(game.id))
                    }
                    className="bg-rog-blue px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>Import All</span>
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
                {foundGames.map((game) => (
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
                      onClick={() => addGameToLibrary(game.id)}
                      disabled={game.status === "added"}
                      className={`${
                        game.status === "added"
                          ? "bg-green-500/20"
                          : "bg-rog-blue/20 hover:bg-rog-blue/30"
                      } p-2 rounded-lg transition-colors group relative`}
                    >
                      {game.status === "added" ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Plus className="w-5 h-5 text-rog-blue group-hover:scale-110 transition-transform" />
                      )}
                      <span className="absolute bg-black/90 text-white text-xs px-2 py-1 rounded -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {game.status === "added" ? "Added" : "Add to Library"}
                      </span>
                    </button>
                  </div>
                ))}
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
                placeholder="Search games..."
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
              placeholder="Select Platform"
              icon={<ShoppingBag className="w-5 h-5" />}
            />
            <DropdownSelect
              options={sortOptions}
              value={sortBy}
              onChange={setSortBy}
              placeholder="Sort by"
              icon={<SlidersHorizontal className="w-5 h-5" />}
            />
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center space-x-2"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span>Filters</span>
            </button>
            <div className="flex rounded-lg overflow-hidden">
              <button
                onClick={() => handleGridViewChange("4x4")}
                className={`px-4 py-2 hover:bg-white/30 transition-colors ${
                  gridView === "4x4" ? "bg-white/20" : "bg-white/10"
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleGridViewChange("3x3")}
                className={`px-4 py-2 hover:bg-white/30 transition-colors ${
                  gridView === "3x3" ? "bg-white/20" : "bg-white/10"
                }`}
              >
                <Layout className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Game Categories */}
        <div className="flex items-center space-x-4 mb-8 overflow-x-auto pb-2">
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
                {category}
              </button>
            ))}
          {gameCategories.length > 6 && (
            <button
              onClick={() => setShowMoreCategories(!showMoreCategories)}
              className="bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors whitespace-nowrap flex items-center space-x-1"
            >
              <span>{showMoreCategories ? "Less" : "More"}</span>
              <ChevronDown
                className={`w-4 h-4 transform transition-transform ${
                  showMoreCategories ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>

        {/* Games Grid */}
        <div
          className={`grid gap-6 ${
            gridView === "3x3"
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          }`}
        >
          {filteredGames.map((game) => (
            <a
              key={game.id}
              href={`/game/${game.id}`}
              className="bg-game-card rounded-lg overflow-hidden group hover:ring-2 hover:ring-rog-blue transition-all"
            >
              <div className="relative">
                <img
                  src={game.cover_image}
                  alt={game.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 right-3 flex space-x-2">
                  <span
                    className={`${
                      game.status === "synced"
                        ? "bg-green-500/90"
                        : "bg-yellow-500/90"
                    } text-white px-2 py-1 rounded text-sm`}
                  >
                    {game.status === "synced" ? "Synced" : "Syncing..."}
                  </span>
                  <button className="bg-black/50 p-1.5 rounded-lg hover:bg-black/70 transition-colors">
                    <Star className="w-5 h-5" />
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
                  <img
                    src="https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/steamworks_logo.png"
                    alt={game.platform}
                    className="w-5 h-5"
                  />
                  <span className="text-sm text-gray-400">{game.platform}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <File className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">{game.save_count} saves</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Scale className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">{game.size}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}

          {/* Add Game Card */}
          <div
            onClick={() => setShowAddGameModal(true)}
            className="bg-game-card rounded-lg overflow-hidden border-2 border-dashed border-white/20 flex items-center justify-center h-[400px] cursor-pointer hover:border-rog-blue transition-colors group"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-rog-blue/20 transition-colors">
                <Plus className="w-8 h-8 text-white/70 group-hover:text-rog-blue transition-colors" />
              </div>
              <h3 className="text-lg font-medium text-white/70 group-hover:text-white transition-colors">
                Add New Game
              </h3>
              <p className="text-sm text-white/50 mt-2 max-w-[200px]">
                Import a new game to manage its save files
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
    </div>
  );
};

export default GameUI;
