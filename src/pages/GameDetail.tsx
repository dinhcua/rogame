import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useParams } from "react-router-dom";
import DropdownSelect from "../components/DropdownSelect";
import SaveFileItem from "../components/SaveFileItem";
import BackupSettings from "../components/BackupSettings";
import CloudStorage from "../components/CloudStorage";
import StorageInfo from "../components/StorageInfo";
import RestoreModal from "../components/RestoreModal";
import { Tag, Settings } from "lucide-react";
import { Game } from "../types/game";

interface SaveFile {
  id: string;
  game_id: string;
  file_name: string;
  created_at: string;
  modified_at: string;
  size_bytes: number;
  tags: string[];
}

const GameDetail: React.FC = () => {
  const { id: gameId } = useParams<{ id: string }>();
  const [selectedTag, setSelectedTag] = useState("all");
  const [saveFiles, setSaveFiles] = useState<SaveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSaveId, setSelectedSaveId] = useState<string | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [gameDetails, setGameDetails] = useState<Game | null>(null);

  const tagOptions = [
    { value: "all", label: "All Files" },
    { value: "boss_fight", label: "Boss Fight" },
    { value: "achievement", label: "Achievement" },
    { value: "story", label: "Story" },
    { value: "checkpoint", label: "Checkpoint" },
  ];

  const loadGameDetails = async () => {
    if (!gameId) return;

    try {
      setIsLoading(true);
      const result = await invoke<Record<string, Game>>("scan_games");
      const game = result[gameId];
      if (game) {
        setGameDetails(game);
      } else {
        setError("Game not found");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load game details"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadSaveFiles = async () => {
    if (!gameId) return;

    try {
      setIsLoading(true);
      const files = await invoke<SaveFile[]>("list_saves", { gameId });
      setSaveFiles(files);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load save files"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackup = async () => {
    if (!gameId) return;

    try {
      setIsLoading(true);
      setError(null);
      const newSave = await invoke<SaveFile>("backup_save", { gameId });
      setSaveFiles((prev) => [...prev, newSave]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to backup save file"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (saveFile: SaveFile) => {
    if (!gameId) return;

    try {
      setIsLoading(true);
      setError(null);
      console.log("Attempting to restore save:", {
        gameId,
        saveId: saveFile.id,
      });

      const result = await invoke<SaveFile>("restore_save", {
        gameId,
        saveId: saveFile.id,
      });

      console.log("Restore successful:", result);
      setIsRestoreModalOpen(false);
      const successMessage = `Successfully restored save file: ${result.file_name}`;
      setError(successMessage);
    } catch (err) {
      console.error("Restore failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to restore save file"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGameDetails();
    loadSaveFiles();
  }, [gameId]);

  const filteredSaveFiles =
    selectedTag === "all"
      ? saveFiles
      : saveFiles.filter((file) => file.tags.includes(selectedTag));

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
                className="w-40 h-52 rounded-lg mr-8 shadow-2xl"
              />
              <div>
                <h1 className="text-5xl font-bold mb-2">
                  {gameDetails?.title || "Loading..."}
                </h1>
                <p className="text-xl text-gray-300 mb-6">Save Files Manager</p>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleBackup}
                    disabled={isLoading}
                    className={`bg-green-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-green-500 transition-colors ${
                      isLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isLoading ? "Backing up..." : "Backup Save"}
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
                    Restore Save
                  </button>
                </div>
                {error && (
                  <p
                    className={`mt-2 ${
                      error.includes("Successfully")
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {error}
                  </p>
                )}
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
              <h2 className="text-2xl font-bold mb-4">Save Details</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-gray-400 mb-2">Total Saves</h3>
                  <p>{gameDetails?.save_count || 0} Save Files</p>
                </div>
                <div>
                  <h3 className="text-gray-400 mb-2">Platform</h3>
                  <p>{gameDetails?.platform || "Unknown"}</p>
                </div>
                <div>
                  <h3 className="text-gray-400 mb-2">Last Played</h3>
                  <p>{gameDetails?.last_played || "Never"}</p>
                </div>
                <div>
                  <h3 className="text-gray-400 mb-2">Category</h3>
                  <p>{gameDetails?.category || "Unknown"}</p>
                </div>
              </div>
            </div>

            {/* Save Files Section */}
            <div className="bg-game-card rounded-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Save Files</h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {}}
                    className="bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center space-x-2"
                  >
                    <Tag className="w-5 h-5" />
                    <span>Manage Tags</span>
                  </button>
                  <button
                    onClick={() => {}}
                    className="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center space-x-2"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Manage All</span>
                  </button>
                </div>
              </div>

              {/* Tag Filters */}
              <div className="mb-6">
                <DropdownSelect
                  options={tagOptions}
                  value={selectedTag}
                  onChange={setSelectedTag}
                  placeholder="Filter by tag"
                  className="w-48"
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                />
              </div>

              {/* Save Files List */}
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-400">
                    Loading save files...
                  </div>
                ) : filteredSaveFiles.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    {saveFiles.length === 0
                      ? "No save files yet"
                      : "No save files match the selected filter"}
                  </div>
                ) : (
                  filteredSaveFiles.map((saveFile) => (
                    <SaveFileItem
                      key={saveFile.id}
                      saveFile={saveFile}
                      onRestore={handleRestore}
                      onShareClick={() => {}}
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
            <StorageInfo />
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
    </div>
  );
};

export default GameDetail;
