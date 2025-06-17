import { useState, useEffect } from "react";
import { Game } from "../types/game";
import AddGameModal from "../components/AddGameModal";
import DropdownSelect from "../components/DropdownSelect";
import { invoke } from "@tauri-apps/api/core";

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
  const [currentTime, setCurrentTime] = useState<string>("");
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
    // Update time
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      setCurrentTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    // Load grid view preference
    const savedView = localStorage.getItem("gridView") as "3x3" | "4x4";
    if (savedView) {
      setGridView(savedView);
    }

    return () => clearInterval(interval);
  }, []);

  const handleScan = () => {
    setShowScanProgress(true);
    setShowFoundGames(false);
    setScanPercentage(0);

    invoke<Record<string, Game>>("scan_games")
      .then((result) => {
        const games = Object.values(result);
        console.log(games);

        setFoundGames(games);
        setScanPercentage(100);
        setTimeout(() => {
          setShowScanProgress(false);
          setShowFoundGames(true);
        }, 500);
      })
      .catch((error) => {
        console.error("Error scanning games:", error);
        setShowScanProgress(false);
      });

    // const interval = setInterval(() => {
    //   setScanPercentage((prev) => {
    //     if (prev >= 100) {
    //       clearInterval(interval);
    //       return 100;
    //     }

    //     if (prev === 30) setSteamGamesCount(12);
    //     if (prev === 60) setEpicGamesCount(5);

    //     return prev + 5;
    //   });
    // }, 200);
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
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                    clipRule="evenodd"
                  />
                </svg>
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
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm">
                    Steam Library: {steamGamesCount} games found
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-green-500">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm">
                    Epic Games: {epicGamesCount} games found
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
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
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Import All</span>
                  </button>
                  <button
                    onClick={() => setShowFoundGames(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
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
                        <svg
                          className="w-5 h-5 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-rog-blue group-hover:scale-110 transition-transform"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
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
              <svg
                className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <DropdownSelect
              options={platformOptions}
              value={selectedPlatform}
              onChange={setSelectedPlatform}
              placeholder="Select Platform"
              icon={
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            />
            <DropdownSelect
              options={sortOptions}
              value={sortBy}
              onChange={setSortBy}
              placeholder="Sort by"
              icon={
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                </svg>
              }
            />
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
              </svg>
              <span>Filters</span>
            </button>
            <div className="flex rounded-lg overflow-hidden">
              <button
                onClick={() => handleGridViewChange("4x4")}
                className={`px-4 py-2 hover:bg-white/30 transition-colors ${
                  gridView === "4x4" ? "bg-white/20" : "bg-white/10"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => handleGridViewChange("3x3")}
                className={`px-4 py-2 hover:bg-white/30 transition-colors ${
                  gridView === "3x3" ? "bg-white/20" : "bg-white/10"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5z" />
                </svg>
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
              <svg
                className={`w-4 h-4 transform transition-transform ${
                  showMoreCategories ? "rotate-180" : ""
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
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
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium group-hover:text-rog-blue transition-colors">
                    {game.title}
                  </h3>
                  <div className="flex items-center space-x-1 text-gray-400">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
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
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                    <span className="text-sm">{game.save_count} saves</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z"
                        clipRule="evenodd"
                      />
                    </svg>
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
                <svg
                  className="w-8 h-8 text-white/70 group-hover:text-rog-blue transition-colors"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
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
