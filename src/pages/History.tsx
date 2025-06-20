import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { formatDistanceToNow } from "date-fns";
import DropdownSelect from "../components/DropdownSelect";
import { RefreshCw, MoreVertical } from "lucide-react";
import { Game } from "../types/game";
import NotificationModal from "../components/NotificationModal";

interface SaveFile {
  id: string;
  game_id: string;
  file_name: string;
  created_at: string;
  modified_at: string;
  size_bytes: number;
  tags: string[];
}

interface BackupHistoryItem {
  id: string;
  game: Game;
  save_file: SaveFile;
  sync_status: "synced" | "syncing" | "not_synced";
  description: string;
}

interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
}

const BackupCard: React.FC<{
  backup: BackupHistoryItem;
  onRestore: (backup: BackupHistoryItem) => void;
}> = ({ backup, onRestore }) => {
  const getSyncStatusColor = (status: BackupHistoryItem["sync_status"]) => {
    switch (status) {
      case "synced":
        return "text-green-500";
      case "syncing":
        return "text-yellow-500";
      case "not_synced":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getSyncStatusText = (status: BackupHistoryItem["sync_status"]) => {
    switch (status) {
      case "synced":
        return "Cloud Synced";
      case "syncing":
        return "Syncing...";
      case "not_synced":
        return "Not Synced";
      default:
        return "Unknown";
    }
  };

  const formatFileSize = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="bg-game-card rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            src={backup.game.cover_image}
            alt={backup.game.title}
            className="w-16 h-20 rounded-lg object-cover"
          />
          <div>
            <h3 className="text-xl font-bold">
              {backup.game.title} - {backup.save_file.file_name}
            </h3>
            <p className="text-gray-400">
              Created:{" "}
              {formatDistanceToNow(new Date(backup.save_file.created_at))} ago
            </p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm text-gray-400">
                Size: {formatFileSize(backup.save_file.size_bytes)}
              </span>
              <span className="text-sm text-gray-400">•</span>
              <span
                className={`text-sm ${getSyncStatusColor(backup.sync_status)}`}
              >
                {getSyncStatusText(backup.sync_status)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onRestore(backup)}
            className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Restore</span>
          </button>
          <button className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="mt-4 text-gray-400">
        <div className="flex items-center space-x-2 mb-2">
          {backup.save_file.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
        {backup.description}
      </div>
    </div>
  );
};

export default function History() {
  const [backups, setBackups] = useState<BackupHistoryItem[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
    isOpen: boolean;
  }>({
    message: "",
    type: "success",
    isOpen: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState("all");
  const [selectedTime, setSelectedTime] = useState("all");
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10,
  });

  const timeOptions = [
    { value: "all", label: "All Time" },
    { value: "24h", label: "Last 24 Hours" },
    { value: "week", label: "Last Week" },
    { value: "month", label: "Last Month" },
  ];

  const loadGames = async () => {
    try {
      const result = await invoke<Record<string, Game>>("scan_games");
      setGames(Object.values(result));
    } catch (err) {
      console.error("Failed to load games:", err);
      setNotification({
        message: "Failed to load games",
        type: "error",
        isOpen: true,
      });
    }
  };

  const loadBackups = async () => {
    try {
      setLoading(true);
      setNotification({
        message: "",
        type: "success",
        isOpen: false,
      });

      // First get all games
      const gamesResult = await invoke<Record<string, Game>>("scan_games");
      const allGames = Object.values(gamesResult);

      // Then get save files for each game
      let allBackups: BackupHistoryItem[] = [];
      for (const game of allGames) {
        const saveFiles = await invoke<SaveFile[]>("list_saves", {
          gameId: game.title,
        });
        const gameBackups = saveFiles.map((save) => ({
          id: `${game.title}-${save.id}`,
          game: game,
          save_file: save,
          sync_status: "synced" as const,
          description: `Backup for ${game.title}`,
        }));
        allBackups = [...allBackups, ...gameBackups];
      }

      // Apply filters
      let filteredBackups = allBackups;

      if (selectedGame !== "all") {
        filteredBackups = filteredBackups.filter(
          (b) => b.game.title === selectedGame
        );
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredBackups = filteredBackups.filter(
          (b) =>
            b.game.title.toLowerCase().includes(query) ||
            b.save_file.file_name.toLowerCase().includes(query)
        );
      }

      // Sort by date
      filteredBackups.sort(
        (a, b) =>
          new Date(b.save_file.created_at).getTime() -
          new Date(a.save_file.created_at).getTime()
      );

      // Apply pagination
      const start = (pagination.current_page - 1) * pagination.items_per_page;
      const end = start + pagination.items_per_page;
      const paginatedBackups = filteredBackups.slice(start, end);

      setBackups(paginatedBackups);
      setPagination((prev) => ({
        ...prev,
        total_items: filteredBackups.length,
        total_pages: Math.ceil(
          filteredBackups.length / pagination.items_per_page
        ),
      }));
    } catch (err) {
      console.error("Failed to load backups:", err);
      setNotification({
        message: "Failed to load backups",
        type: "error",
        isOpen: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (backup: BackupHistoryItem) => {
    try {
      console.log("Restoring backup:", {
        gameId: backup.game.title,
        saveId: backup.save_file.id,
      });

      await invoke("restore_save", {
        gameId: backup.game.title,
        saveId: backup.save_file.id,
      });

      setNotification({
        message: "Successfully restored save file",
        type: "success",
        isOpen: true,
      });
    } catch (err) {
      console.error("Failed to restore backup:", err);
      setNotification({
        message: "Failed to restore backup",
        type: "error",
        isOpen: true,
      });
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, current_page: page }));
  };

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    loadBackups();
  }, [pagination.current_page, selectedGame, selectedTime, searchQuery]);

  const gameOptions = [
    { value: "all", label: "All Games" },
    ...games.map((game) => ({
      value: game.title,
      label: game.title,
    })),
  ];

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Filters and Search */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search backups..."
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
            options={gameOptions}
            value={selectedGame}
            onChange={setSelectedGame}
            placeholder="Select Game"
            className="w-48"
          />
          <DropdownSelect
            options={timeOptions}
            value={selectedTime}
            onChange={setSelectedTime}
            placeholder="Select Time Range"
            className="w-48"
          />
        </div>
        <div className="flex items-center space-x-4">
          <button className="bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center space-x-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Export</span>
          </button>
          <button className="bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center space-x-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Backup List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rog-blue mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading backups...</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No backups found</div>
        ) : (
          backups.map((backup) => (
            <BackupCard
              key={backup.id}
              backup={backup}
              onRestore={handleRestore}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && backups.length > 0 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-gray-400">
            Showing{" "}
            {(pagination.current_page - 1) * pagination.items_per_page + 1}-
            {Math.min(
              pagination.current_page * pagination.items_per_page,
              pagination.total_items
            )}{" "}
            of {pagination.total_items} backups
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className={`bg-white/10 px-4 py-2 rounded-lg transition-colors ${
                pagination.current_page === 1
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-white/20"
              }`}
            >
              Previous
            </button>
            {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  page === 1 ||
                  page === pagination.total_pages ||
                  Math.abs(page - pagination.current_page) <= 1
              )
              .map((page, index, array) => {
                if (index > 0 && array[index - 1] !== page - 1) {
                  return (
                    <React.Fragment key={`ellipsis-${page}`}>
                      <span className="px-2">...</span>
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-lg ${
                          pagination.current_page === page
                            ? "bg-rog-blue"
                            : "bg-white/10 hover:bg-white/20"
                        } transition-colors`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                }
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg ${
                      pagination.current_page === page
                        ? "bg-rog-blue"
                        : "bg-white/10 hover:bg-white/20"
                    } transition-colors`}
                  >
                    {page}
                  </button>
                );
              })}
            <button
              onClick={() => handlePageChange(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.total_pages}
              className={`bg-white/10 px-4 py-2 rounded-lg transition-colors ${
                pagination.current_page === pagination.total_pages
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-white/20"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification((prev) => ({ ...prev, isOpen: false }))}
        message={notification.message}
        type={notification.type}
      />
    </div>
  );
}
