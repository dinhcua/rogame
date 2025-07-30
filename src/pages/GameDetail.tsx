import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import BackupSettings from "../components/BackupSettings";
import CloudStorage from "../components/CloudStorage";
import CommunitySharedSaves from "../components/CommunitySharedSaves";
import SaveFileItem from "../components/SaveFileItem";
// import StorageInfo from "../components/StorageInfo";
import RestoreModal from "../components/RestoreModal";
import DeleteGameModal from "../components/DeleteGameModal";
import { Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { Game } from "../types/game";
import useGameStore from "../store/gameStore";
import { useToast } from "../hooks/useToast";
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
  origin_path: string;
  cloud?: string | null;
}

interface BackupResponse {
  save_file: SaveFile;
  backup_time: number;
  save_count: number;
}

interface GameBackupSettings {
  auto_backup: boolean;
  backup_interval: string;
  max_backups: number;
  compression_enabled: boolean;
}

const GameDetail: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { id: gameId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deleteGame } = useGameStore();
  const { success, error: showError } = useToast();
  // Upload functionality is now handled by BackupActionDropdown component
  const [saveFiles, setSaveFiles] = useState<SaveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSaveId, setSelectedSaveId] = useState<string | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [gameDetails, setGameDetails] = useState<Game | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [includeSaveFiles, setIncludeSaveFiles] = useState(false);
  const [autoBackupInterval, setAutoBackupInterval] = useState<ReturnType<
    typeof setInterval
  > | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Initialize language from localStorage
  useEffect(() => {
    const storedLanguage = localStorage.getItem("language");
    if (storedLanguage && i18n.language !== storedLanguage) {
      i18n.changeLanguage(storedLanguage);
    }
  }, []);

  console.log("error", error);

  // const tagOptions = [
  //   { value: "all", label: "All Files" },
  //   { value: "boss_fight", label: "Boss Fight" },
  //   { value: "achievement", label: "Achievement" },
  //   { value: "story", label: "Story" },
  //   { value: "checkpoint", label: "Checkpoint" },
  // ];

  // Load game details and save files
  useEffect(() => {
    const initializeGameData = async () => {
      if (!gameId) return;

      try {
        setIsLoading(true);
        setError(null);

        console.log("Loading game details for ID:", gameId);

        // Load game details from SQLite database
        const game = await invoke<Game>("get_game_by_id", { id: gameId });

        console.log("Game loaded:", game);

        if (game) {
          // Load save files
          const files = await invoke<SaveFile[]>("list_saves", {
            gameId: game.id,
          });

          // Update game with correct save count
          const updatedGame = {
            ...game,
            save_count: files.length,
          };

          setGameDetails(updatedGame);
          setSaveFiles(files);

          // Update the game in the store
          await useGameStore.getState().updateGame(updatedGame);
        } else {
          setError("Game not found");
          showError(t("gameDetail.errors.gameNotFound"));
        }
      } catch (err) {
        console.error("Error loading game details:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load game details";
        setError(errorMessage);
        showError(t("gameDetail.errors.loadFailed", { error: errorMessage }));
      } finally {
        setIsLoading(false);
      }
    };

    initializeGameData();
  }, [gameId]);

  const handleBackup = async () => {
    if (!gameId || !gameDetails) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await invoke<BackupResponse>("backup_save", {
        gameId: gameDetails.id,
      });

      // Update save files list
      setSaveFiles((prev) => [response.save_file, ...prev]);
      setCurrentPage(1); // Reset to first page to show the new backup

      // Update game details with new backup time and save count from response
      setGameDetails((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          last_backup_time: response.backup_time,
          save_count: response.save_count,
        };
      });

      // Update the game in the store
      if (gameDetails) {
        const updatedGame = {
          ...gameDetails,
          last_backup_time: response.backup_time,
          save_count: response.save_count,
        };
        await useGameStore.getState().updateGame(updatedGame);
      }

      success(t("gameDetail.success.backupCreated"));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to backup save file";
      setError(errorMessage);
      showError(t("gameDetail.errors.backupFailed", { error: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (saveFile: SaveFile) => {
    if (!saveFile) {
      showError("Save file not found");
      return;
    }
    if (!gameId || !gameDetails) return;

    try {
      setIsLoading(true);
      setError(null);
      console.log("Attempting to restore save:", {
        gameId: gameDetails.title,
        saveId: saveFile.id,
      });

      const result = await invoke<SaveFile>("restore_save", {
        gameId: gameDetails.id,
        saveId: saveFile.id,
      });

      console.log("Restore successful:", result);
      setIsRestoreModalOpen(false);
      success(
        t("gameDetail.success.saveRestored", { fileName: result.file_name })
      );

      // Refresh game details to get updated last_played time
      if (gameId) {
        const updatedGame = await invoke<Game>("get_game_by_id", {
          id: gameId,
        });
        setGameDetails(updatedGame);
        await useGameStore.getState().updateGame(updatedGame);
      }
    } catch (err) {
      console.error("Restore failed:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to restore save file";
      setError(errorMessage);
      showError(t("gameDetail.errors.restoreFailed", { error: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGame = async () => {
    if (!gameId || !gameDetails) return;

    try {
      setIsLoading(true);
      setError(null);

      await deleteGame(gameId, includeSaveFiles);
      success(t("gameDetail.success.gameDeleted"));
      navigate("/"); // Navigate back to game list after deletion
    } catch (error) {
      console.error("Delete game error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete game";
      setError(errorMessage);
      showError(t("gameDetail.errors.deleteFailed", { error: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSave = async (saveFile: SaveFile) => {
    if (!gameId) return;

    try {
      setIsLoading(true);
      await invoke("delete_save", {
        gameId: saveFile.game_id,
        saveId: saveFile.id,
      });

      // Remove the deleted save file from the list
      setSaveFiles((prev) => prev.filter((sf) => sf.id !== saveFile.id));
      
      // Update game details save count
      if (gameDetails) {
        const updatedGame = {
          ...gameDetails,
          save_count: saveFiles.length - 1,
        };
        setGameDetails(updatedGame);
        await useGameStore.getState().updateGame(updatedGame);
      }

      success(t("gameDetail.success.saveDeleted", { fileName: saveFile.file_name }));
    } catch (error) {
      console.error("Delete save error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete save file";
      showError(t("gameDetail.errors.deleteSaveFailed", { error: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  // These functions are now handled by BackupActionDropdown component

  // Load backup settings and setup auto-backup
  useEffect(() => {
    const setupAutoBackup = async () => {
      try {
        const settings = await invoke<GameBackupSettings>(
          "load_backup_settings"
        );
        if (settings.auto_backup && gameId && gameDetails) {
          // Convert interval to milliseconds
          const intervalMs =
            settings.backup_interval === "15min"
              ? 15 * 60 * 1000
              : settings.backup_interval === "30min"
              ? 30 * 60 * 1000
              : 60 * 60 * 1000; // 1hour

          const interval = setInterval(async () => {
            try {
              await handleBackup();
            } catch (error) {
              console.error("Auto-backup failed:", error);
              showError(t("gameDetail.errors.autoBackupFailed"));
            }
          }, intervalMs);

          setAutoBackupInterval(interval);
        }
      } catch (error) {
        console.error("Failed to setup auto-backup:", error);
      }
    };

    setupAutoBackup();

    // Cleanup interval on unmount
    return () => {
      if (autoBackupInterval) {
        clearInterval(autoBackupInterval);
      }
    };
  }, [gameId, gameDetails]);

  const getLastSaveTime = () => {
    if (saveFiles.length === 0) {
      return t("gameDetail.saveDetails.never");
    }

    // Sort save files by modified time (newest first)
    const sortedSaves = [...saveFiles].sort(
      (a, b) =>
        new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime()
    );

    // Format the date of the most recent save
    const lastSave = new Date(sortedSaves[0].modified_at);
    return lastSave.toLocaleString(i18n.language, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="animate-fade-in">
      {/* Epic Games Style Header */}
      <div className="relative h-[350px] mb-8">
        {/* Background image with blur */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={gameDetails?.cover_image || ""}
            alt=""
            className="w-full h-full object-cover filter blur-xl scale-110 opacity-40"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-game-dark via-game-dark/90 to-game-dark/50"></div>

        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end gap-8">
              <img
                src={gameDetails?.cover_image || ""}
                alt={`${gameDetails?.title || "Game"} Cover`}
                className="w-40 h-52 rounded-xl shadow-2xl object-cover border-2 border-epic-border/50"
              />
              <div className="flex-1 mb-4">
                <h1 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">
                  {gameDetails?.title || "Loading..."}
                </h1>
                <p className="text-lg text-gray-300 mb-4">
                  {t("gameDetail.title")}
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackup}
                    disabled={isLoading}
                    className={`bg-epic-success px-6 py-2.5 rounded-lg text-base font-medium hover:bg-epic-success/90 transition-all duration-200 shadow-lg hover:shadow-epic-success/20 ${
                      isLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isLoading
                      ? t("gameDetail.actions.backingUp")
                      : t("gameDetail.actions.backup")}
                  </button>
                  <button
                    onClick={() => setIsRestoreModalOpen(true)}
                    disabled={isLoading || saveFiles.length === 0}
                    className={`bg-rog-blue px-6 py-2.5 rounded-lg text-base font-medium hover:bg-epic-accent transition-all duration-200 shadow-lg hover:shadow-rog-blue/20 ${
                      isLoading || saveFiles.length === 0
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {t("gameDetail.actions.restore")}
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-epic-danger/20 backdrop-blur-sm px-6 py-2.5 rounded-lg text-base font-medium hover:bg-epic-danger/30 transition-all duration-200 border border-epic-danger/30 hover:border-epic-danger/50"
                  >
                    {t("gameDetail.actions.deleteGame")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="col-span-8 space-y-6">
            {/* Save Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-game-card/50 backdrop-blur-sm rounded-xl p-4 border border-epic-border/50">
                <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                  {t("gameDetail.saveDetails.totalSaves")}
                </h3>
                <p className="text-2xl font-bold text-white">
                  {gameDetails?.save_count || 0}
                </p>
              </div>
              <div className="bg-game-card/50 backdrop-blur-sm rounded-xl p-4 border border-epic-border/50">
                <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                  {t("gameDetail.saveDetails.platform")}
                </h3>
                <p className="text-2xl font-bold text-white">
                  {gameDetails?.platform || t("gameDetail.saveDetails.unknown")}
                </p>
              </div>
              <div className="bg-game-card/50 backdrop-blur-sm rounded-xl p-4 border border-epic-border/50">
                <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                  {t("gameDetail.saveDetails.lastPlayed")}
                </h3>
                <p className="text-base font-semibold text-white">
                  {getLastSaveTime()}
                </p>
              </div>
              <div className="bg-game-card/50 backdrop-blur-sm rounded-xl p-4 border border-epic-border/50">
                <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                  {t("gameDetail.saveDetails.category")}
                </h3>
                <p className="text-base font-semibold text-white">
                  {gameDetails?.category || t("gameDetail.saveDetails.unknown")}
                </p>
              </div>
            </div>

            {/* Save Files Section */}
            <div className="bg-game-card/50 backdrop-blur-sm rounded-xl p-5 border border-epic-border/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  {t("gameDetail.saveFiles.title")}
                </h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {}}
                    className="bg-epic-hover/50 backdrop-blur-sm border border-epic-border px-4 py-2 rounded-lg hover:bg-epic-hover hover:border-gray-600 transition-all duration-200 flex items-center space-x-2 text-sm font-medium"
                  >
                    <Settings className="w-4 h-4" />
                    <span>{t("gameDetail.saveFiles.manageAll")}</span>
                  </button>
                </div>
              </div>

              {/* Save Files List */}
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-400">
                    {t("gameDetail.saveFiles.loading")}
                  </div>
                ) : saveFiles.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    {t("gameDetail.saveFiles.noSaves")}
                  </div>
                ) : (
                  <>
                    {/* Save files for current page using SaveFileItem component */}
                    {(() => {
                      const startIndex = (currentPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const currentSaveFiles = saveFiles.slice(
                        startIndex,
                        endIndex
                      );

                      return currentSaveFiles.map((saveFile) => (
                        <SaveFileItem
                          key={saveFile.id}
                          saveFile={saveFile}
                          onRestore={handleRestore}
                          onDelete={handleDeleteSave}
                          isDeleting={isLoading}
                        />
                      ));
                    })()}

                    {/* Pagination controls */}
                    {saveFiles.length > itemsPerPage && (
                      <div className="flex items-center justify-between pt-4 border-t border-epic-border/50">
                        <div className="text-sm text-gray-400">
                          {t("common.pagination.showing", {
                            start: (currentPage - 1) * itemsPerPage + 1,
                            end: Math.min(
                              currentPage * itemsPerPage,
                              saveFiles.length
                            ),
                            total: saveFiles.length,
                          })}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(1, prev - 1))
                            }
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg bg-epic-hover/50 hover:bg-epic-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <div className="flex items-center gap-1">
                            {Array.from({
                              length: Math.ceil(
                                saveFiles.length / itemsPerPage
                              ),
                            }).map((_, index) => {
                              const pageNumber = index + 1;
                              return (
                                <button
                                  key={pageNumber}
                                  onClick={() => setCurrentPage(pageNumber)}
                                  className={`w-8 h-8 rounded-lg font-medium text-sm transition-all duration-200 ${
                                    currentPage === pageNumber
                                      ? "bg-rog-blue text-white"
                                      : "bg-epic-hover/50 hover:bg-epic-hover text-gray-300"
                                  }`}
                                >
                                  {pageNumber}
                                </button>
                              );
                            })}
                          </div>

                          <button
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(
                                  Math.ceil(saveFiles.length / itemsPerPage),
                                  prev + 1
                                )
                              )
                            }
                            disabled={
                              currentPage ===
                              Math.ceil(saveFiles.length / itemsPerPage)
                            }
                            className="p-2 rounded-lg bg-epic-hover/50 hover:bg-epic-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Community Shared Saves Section */}
            {gameDetails && (
              <CommunitySharedSaves
                gameId={gameDetails.id}
                gameTitle={gameDetails.title}
              />
            )}
          </div>

          {/* Right Column */}
          <div className="col-span-4 space-y-8">
            <BackupSettings />
            <CloudStorage />
            {/* <StorageInfo /> */}
          </div>
        </div>
      </div>

      {/* Restore Modal */}
      <RestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onRestore={handleRestore}
        saveFiles={saveFiles}
        selectedSaveId={selectedSaveId}
        onSelectSave={setSelectedSaveId}
      />

      {/* Delete Game Modal */}
      <DeleteGameModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setIncludeSaveFiles(false);
        }}
        onDelete={handleDeleteGame}
        gameTitle={gameDetails?.title || ""}
        includeSaveFiles={includeSaveFiles}
        setIncludeSaveFiles={setIncludeSaveFiles}
      />
    </div>
  );
};

export default GameDetail;
