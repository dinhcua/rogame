import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SaveFileItem from "../components/SaveFileItem";
import BackupSettings from "../components/BackupSettings";
import CloudStorage from "../components/CloudStorage";
// import StorageInfo from "../components/StorageInfo";
import RestoreModal from "../components/RestoreModal";
import DeleteGameModal from "../components/DeleteGameModal";
import { Settings } from "lucide-react";
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
  const [saveFiles, setSaveFiles] = useState<SaveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSaveId, setSelectedSaveId] = useState<string | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [gameDetails, setGameDetails] = useState<Game | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [includeSaveFiles, setIncludeSaveFiles] = useState(false);
  const [isDeletingSave, setIsDeletingSave] = useState(false);
  const [autoBackupInterval, setAutoBackupInterval] = useState<ReturnType<
    typeof setInterval
  > | null>(null);

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
      setSaveFiles((prev) => [...prev, response.save_file]);

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
    if (!gameId || !gameDetails) return;

    try {
      setIsDeletingSave(true);
      setError(null);

      console.log("Deleting save file:", {
        gameId: gameDetails.title,
        saveId: saveFile.file_name,
      });

      // Delete the save file using the Tauri command
      await invoke("delete_save_file", {
        gameId: gameDetails.title,
        saveId: saveFile.file_name,
      });

      // Remove the deleted save from the state
      setSaveFiles((prev) => prev.filter((file) => file.id !== saveFile.id));

      // Update game details if needed
      if (gameDetails) {
        const updatedGame = {
          ...gameDetails,
          save_count: gameDetails.save_count - 1,
        };
        setGameDetails(updatedGame);

        // Update the game in the database
        await invoke("update_game", { game: updatedGame });

        // Update the game in the store
        await useGameStore.getState().updateGame(updatedGame);
      }

      success(t("gameDetail.success.saveDeleted"));
    } catch (err) {
      console.error("Failed to delete save file:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete save file";
      setError(errorMessage);
      showError(
        t("gameDetail.errors.saveDeleteFailed", { error: errorMessage })
      );
    } finally {
      setIsDeletingSave(false);
    }
  };

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
    <div>
      {/* Game Header */}
      <div className="relative h-[500px]">
        <img
          src={gameDetails?.cover_image || ""}
          alt={`${gameDetails?.title || "Game"} Banner`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-game-dark via-game-dark/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center">
              <img
                src={gameDetails?.cover_image || ""}
                alt={`${gameDetails?.title || "Game"} Cover`}
                className="w-40 h-52 rounded-lg mr-8 shadow-2xl object-cover"
              />
              <div>
                <h1 className="text-5xl font-bold mb-2">
                  {gameDetails?.title || "Loading..."}
                </h1>
                <p className="text-xl text-gray-300 mb-6">
                  {t("gameDetail.title")}
                </p>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleBackup}
                    disabled={isLoading}
                    className={`bg-green-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-green-500 transition-colors ${
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
                    className={`bg-blue-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-500 transition-colors ${
                      isLoading || saveFiles.length === 0
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {t("gameDetail.actions.restore")}
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-red-600/20 px-8 py-3 rounded-lg text-lg font-medium hover:bg-red-500/30 transition-colors flex items-center space-x-2"
                  >
                    <span>{t("gameDetail.actions.deleteGame")}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="col-span-8 space-y-8">
            {/* Save Details Section */}
            <div className="bg-game-card rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-4">
                {t("gameDetail.saveDetails.title")}
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-gray-400 mb-2">
                    {t("gameDetail.saveDetails.totalSaves")}
                  </h3>
                  <p>
                    {gameDetails?.save_count || 0}{" "}
                    {t("gameDetail.saveDetails.saveFiles")}
                  </p>
                </div>
                <div>
                  <h3 className="text-gray-400 mb-2">
                    {t("gameDetail.saveDetails.platform")}
                  </h3>
                  <p>
                    {gameDetails?.platform ||
                      t("gameDetail.saveDetails.unknown")}
                  </p>
                </div>
                <div>
                  <h3 className="text-gray-400 mb-2">
                    {t("gameDetail.saveDetails.lastPlayed")}
                  </h3>
                  <p>{getLastSaveTime()}</p>
                </div>
                <div>
                  <h3 className="text-gray-400 mb-2">
                    {t("gameDetail.saveDetails.category")}
                  </h3>
                  <p>
                    {gameDetails?.category ||
                      t("gameDetail.saveDetails.unknown")}
                  </p>
                </div>
              </div>
            </div>

            {/* Save Files Section */}
            <div className="bg-game-card rounded-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {t("gameDetail.saveFiles.title")}
                </h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {}}
                    className="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center space-x-2"
                  >
                    <Settings className="w-5 h-5" />
                    <span>{t("gameDetail.saveFiles.manageAll")}</span>
                  </button>
                </div>
              </div>

              {/* Save Files List */}
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-400">
                    {t("gameDetail.saveFiles.loading")}
                  </div>
                ) : saveFiles.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    {t("gameDetail.saveFiles.noSaves")}
                  </div>
                ) : (
                  saveFiles.map((saveFile) => (
                    <SaveFileItem
                      key={saveFile.id}
                      saveFile={saveFile}
                      onRestore={handleRestore}
                      onDelete={handleDeleteSave}
                      isDeleting={isDeletingSave}
                    />
                  ))
                )}
              </div>
            </div>
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
