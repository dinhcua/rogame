import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import DropdownSelect from "../components/DropdownSelect";
import {
  RefreshCw,
  MoreVertical,
  Upload,
  FolderOpen,
  FolderInput,
  Trash2,
} from "lucide-react";
import { Game } from "../types/game";
import { useToast } from "../hooks/useToast";
import { useServerUpload } from "../hooks/useServerUpload";
import { useCloudStorage } from "../hooks/useCloudStorage";
import PlatformIcon from "../components/PlatformIcon";
import { CloudProvider } from "../types/cloud";
import { formatFileSize, getDisplayName, formatTimeAgo } from "../utils/format";
import "../i18n/config";

interface SaveFile {
  id: string;
  game_id: string;
  file_name: string;
  created_at: string;
  modified_at: string;
  size_bytes: number;
  tags: string[];
  file_path: string;
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
  isDropdownOpen: boolean;
  onDropdownToggle: () => void;
}> = ({ backup, onRestore, isDropdownOpen, onDropdownToggle }) => {
  const { t, i18n } = useTranslation();
  const showDropdown = isDropdownOpen;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { uploadFile, isUploading } = useServerUpload();
  const { error, success } = useToast();
  const { 
    isProviderConnected, 
    getProviderName,
    uploadGameSaves,
    isLoading: isCloudUploading 
  } = useCloudStorage();

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
    return t(`history.backup.status.${status}`);
  };



  return (
    <div className="relative bg-game-card/50 backdrop-blur-sm rounded-xl p-5 border border-epic-border/50 hover:border-rog-blue/30 transition-all duration-200 group">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="relative">
            <img
              src={backup.game.cover_image}
              alt={backup.game.title}
              className="w-20 h-24 rounded-md object-cover shadow-lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white mb-1 truncate">
              {backup.game.title}
            </h3>
            <p className="text-sm text-gray-400 mb-2">
              {getDisplayName(backup.save_file.file_name, t, i18n)}
            </p>
            <div className="flex items-center flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-gray-300">
                  {formatTimeAgo(backup.save_file.created_at, t)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span className="text-gray-300">
                  {formatFileSize(backup.save_file.size_bytes)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    backup.sync_status === "synced"
                      ? "bg-epic-success"
                      : backup.sync_status === "syncing"
                      ? "bg-epic-warning animate-pulse"
                      : "bg-epic-danger"
                  }`}
                />
                <span className={`${getSyncStatusColor(backup.sync_status)}`}>
                  {getSyncStatusText(backup.sync_status)}
                </span>
              </div>
            </div>
            {backup.save_file.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                {backup.save_file.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-rog-blue/20 text-rog-blue px-2 py-0.5 rounded text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onRestore(backup)}
            className="bg-rog-blue px-2 py-2 rounded-lg hover:bg-epic-accent transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-rog-blue/20 whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t("history.backup.restore")}</span>
          </button>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                onDropdownToggle();
              }}
              className="p-3 rounded-lg hover:bg-epic-hover transition-colors flex-shrink-0"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            {showDropdown && (
              <div
                className="absolute right-0 top-full mt-2 w-64 bg-game-card/95 backdrop-blur-sm rounded-xl border border-epic-border/50 shadow-2xl overflow-hidden z-[200]"
              >
                <button
                  className="w-full px-4 py-3 text-left hover:bg-epic-hover transition-colors flex items-center gap-3 text-sm border-b border-epic-border/30"
                  onClick={async () => {
                    onDropdownToggle();
                    try {
                      const result = await uploadFile(
                        backup.save_file.file_path,
                        backup.save_file.file_name
                      );
                      if (result) {
                        success(
                          t("history.notifications.uploadSuccess") ||
                            "Save file uploaded successfully"
                        );
                      }
                    } catch (err) {
                      error(
                        t("history.notifications.uploadError") ||
                          "Failed to upload to server"
                      );
                    }
                  }}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-gray-300">
                        {t("history.actions.uploading") || "Uploading..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">
                        {t("history.actions.uploadToServer")}
                      </span>
                    </>
                  )}
                </button>
                
                {/* Cloud Provider Upload Buttons */}
                {(['google_drive', 'dropbox', 'onedrive'] as CloudProvider[]).map((provider) => {
                  const isConnected = isProviderConnected(provider);
                  if (!isConnected) return null;
                  
                  return (
                    <button
                      key={provider}
                      className="w-full px-4 py-3 text-left hover:bg-epic-hover transition-colors flex items-center gap-3 text-sm border-b border-epic-border/30"
                      onClick={async () => {
                        onDropdownToggle();
                        try {
                          // Read the backup file
                          const fileData = await invoke<number[]>('read_file_as_bytes', {
                            filePath: backup.save_file.file_path
                          });
                          
                          // Convert to File object
                          const uint8Array = new Uint8Array(fileData);
                          const blob = new Blob([uint8Array]);
                          const file = new File([blob], backup.save_file.file_name, {
                            lastModified: new Date(backup.save_file.modified_at).getTime()
                          });
                          
                          await uploadGameSaves(
                            provider,
                            backup.game.id,
                            backup.game.title,
                            [file]
                          );
                          
                          success(t("history.notifications.uploadSuccess"));
                        } catch (err) {
                          console.error('Failed to upload to cloud:', err);
                          error(t("history.notifications.uploadError"));
                        }
                      }}
                      disabled={isCloudUploading}
                    >
                      {isCloudUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-gray-300">
                            {t("history.actions.uploading")}
                          </span>
                        </>
                      ) : (
                        <>
                          <PlatformIcon platform={provider} className="w-4 h-4" />
                          <span className="text-gray-300">
                            {t("history.actions.uploadToProvider", { provider: getProviderName(provider) })}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
                
                <button
                  className="w-full px-4 py-3 text-left hover:bg-epic-hover transition-colors flex items-center gap-3 text-sm border-b border-epic-border/30"
                  onClick={async () => {
                    onDropdownToggle();
                    try {
                      await invoke("open_save_location", {
                        gameId: backup.game.id,
                        backup: false,
                      });
                    } catch (err) {
                      error(
                        t("history.notifications.openLocationError") ||
                          "Failed to open save location"
                      );
                    }
                  }}
                >
                  <FolderInput className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">
                    {t("history.actions.openOriginalLocation")}
                  </span>
                </button>
                <button
                  className="w-full px-4 py-3 text-left hover:bg-epic-hover transition-colors flex items-center gap-3 text-sm"
                  onClick={async () => {
                    onDropdownToggle();
                    try {
                      await invoke("open_save_location", {
                        gameId: backup.game.id,
                        backup: true,
                      });
                    } catch (err) {
                      error(
                        t("history.notifications.openLocationError") ||
                          "Failed to open backup location"
                      );
                    }
                  }}
                >
                  <FolderOpen className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">
                    {t("history.actions.openBackupLocation")}
                  </span>
                </button>
                <button
                  className="w-full px-4 py-3 text-left hover:bg-epic-danger/20 transition-colors flex items-center gap-3 text-sm text-epic-danger"
                  onClick={async () => {
                    onDropdownToggle();
                    if (
                      confirm(
                        t("history.confirmDelete") ||
                          "Are you sure you want to delete this save file?"
                      )
                    ) {
                      try {
                        await invoke("delete_save", {
                          gameId: backup.game.id,
                          saveId: backup.save_file.id,
                        });
                        success(
                          t("history.notifications.deleteSuccess") ||
                            "Save file deleted successfully"
                        );
                        window.location.reload(); // Refresh to update the list
                      } catch (err) {
                        error(
                          t("history.notifications.deleteError") ||
                            "Failed to delete save file"
                        );
                      }
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t("history.actions.deleteSaveFile")}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div className="fixed inset-0 z-[90]" onClick={onDropdownToggle} />
      )}
    </div>
  );
};

export default function History() {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const [backups, setBackups] = useState<BackupHistoryItem[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState("all");
  const [selectedTime, setSelectedTime] = useState("all");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10,
  });

  const timeOptions = [
    { value: "all", label: t("history.filters.timeRange.allTime") },
    { value: "24h", label: t("history.filters.timeRange.last24h") },
    { value: "week", label: t("history.filters.timeRange.lastWeek") },
    { value: "month", label: t("history.filters.timeRange.lastMonth") },
  ];

  const loadGames = async () => {
    try {
      const result = await invoke<Game[]>("get_all_games");
      setGames(result);
    } catch (err) {
      console.error("Failed to load games:", err);
      error(
        t("history.notifications.loadGamesError") || "Failed to load games"
      );
    }
  };

  const loadBackups = async () => {
    try {
      setLoading(true);

      // First get all games
      const gamesResult = await invoke<Game[]>("get_all_games");
      const allGames = gamesResult;

      // Then get save files for each game
      let allBackups: BackupHistoryItem[] = [];
      for (const game of allGames) {
        const saveFiles = await invoke<SaveFile[]>("list_saves", {
          gameId: game.id,
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
      error(
        t("history.notifications.loadBackupsError") || "Failed to load backups"
      );
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
        gameId: backup.game.id,
        saveId: backup.save_file.id,
      });

      success(t("history.notifications.restoreSuccess"));
    } catch (err) {
      console.error("Failed to restore backup:", err);
      error(t("history.notifications.restoreError"));
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    loadBackups();
  }, [pagination.current_page, selectedGame, selectedTime, searchQuery]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, current_page: page }));
  };


  // Close dropdown when clicking escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenDropdownId(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const gameOptions = [
    { value: "all", label: t("history.filters.allGames") },
    ...games.map((game) => ({
      value: game.title,
      label: game.title,
    })),
  ];

  return (
    <div className="text-white font-sans animate-fade-in p-8">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("history.title")}</h1>
        <p className="text-gray-400">{t("history.subtitle")}</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-game-card/50 backdrop-blur-sm rounded-xl p-6 border border-epic-border/50">
          <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-2">
            {t("history.stats.totalBackups")}
          </h3>
          <p className="text-3xl font-bold text-white">
            {pagination.total_items}
          </p>
        </div>
        <div className="bg-game-card/50 backdrop-blur-sm rounded-xl p-6 border border-epic-border/50">
          <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-2">
            {t("history.stats.gamesBackedUp")}
          </h3>
          <p className="text-3xl font-bold text-white">{games.length}</p>
        </div>
        <div className="bg-game-card/50 backdrop-blur-sm rounded-xl p-6 border border-epic-border/50">
          <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-2">
            {t("history.stats.lastBackup")}
          </h3>
          <p className="text-xl font-semibold text-white">
            {backups.length > 0
              ? formatTimeAgo(backups[0].save_file.created_at, t)
              : t("history.stats.never")}
          </p>
        </div>
      </div>
      {/* Filters and Search */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("history.filters.search")}
              className="bg-epic-hover border border-epic-border rounded-lg pl-10 pr-2 py-2 w-80 focus:outline-none focus:ring-2 focus:ring-rog-blue focus:border-transparent transition-all duration-200 hover:bg-epic-hover/80"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-3 top-3.5"
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
            placeholder={t("history.filters.selectGame")}
            className="w-48"
          />
          <DropdownSelect
            options={timeOptions}
            value={selectedTime}
            onChange={setSelectedTime}
            placeholder={t("history.filters.timeRange.title")}
            className="w-48"
          />
        </div>
      </div>

      {/* Backup List */}
      <div className="space-y-4 overflow-visible">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-epic-border rounded-full animate-spin border-t-rog-blue"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-rog-blue/20"></div>
            </div>
            <p className="mt-6 text-gray-400 text-lg animate-pulse">
              {t("history.loading")}
            </p>
          </div>
        ) : backups.length === 0 ? (
          <div className="bg-game-card/30 backdrop-blur-sm rounded-xl p-12 border border-epic-border/30 text-center">
            <div className="w-20 h-20 bg-epic-hover rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {t("history.noBackups")}
            </h3>
            <p className="text-gray-400">{t("history.noBackupsDescription")}</p>
          </div>
        ) : (
          backups.map((backup) => (
            <BackupCard
              key={backup.id}
              backup={backup}
              onRestore={handleRestore}
              isDropdownOpen={openDropdownId === backup.id}
              onDropdownToggle={() => {
                setOpenDropdownId(
                  openDropdownId === backup.id ? null : backup.id
                );
              }}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && backups.length > 0 && (
        <div className="mt-8 bg-game-card/30 backdrop-blur-sm rounded-xl p-4 border border-epic-border/30">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {t("history.pagination.showing", {
                start:
                  (pagination.current_page - 1) * pagination.items_per_page + 1,
                end: Math.min(
                  pagination.current_page * pagination.items_per_page,
                  pagination.total_items
                ),
                total: pagination.total_items,
              })}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  pagination.current_page === 1
                    ? "opacity-50 cursor-not-allowed bg-epic-hover/50"
                    : "bg-epic-hover hover:bg-epic-hover/80 hover:text-white"
                }`}
              >
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
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
                        <span className="px-2 text-gray-500">•••</span>
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 ${
                            pagination.current_page === page
                              ? "bg-rog-blue text-white shadow-lg shadow-rog-blue/20"
                              : "bg-epic-hover hover:bg-epic-hover/80 hover:text-white"
                          }`}
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
                      className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 ${
                        pagination.current_page === page
                          ? "bg-rog-blue text-white shadow-lg shadow-rog-blue/20"
                          : "bg-epic-hover hover:bg-epic-hover/80 hover:text-white"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.total_pages}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  pagination.current_page === pagination.total_pages
                    ? "opacity-50 cursor-not-allowed bg-epic-hover/50"
                    : "bg-epic-hover hover:bg-epic-hover/80 hover:text-white"
                }`}
              >
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
