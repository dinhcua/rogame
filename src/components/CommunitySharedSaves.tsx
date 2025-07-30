import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Users, ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import SharedSaveItem from "./SharedSaveItem";
import { useToast } from "../hooks/useToast";
import { invoke } from "@tauri-apps/api/core";

interface SharedSave {
  id: string;
  game_id: string;
  game_title: string;
  file_name: string;
  description: string;
  uploaded_by: string;
  uploaded_at: string;
  download_count: number;
  size_bytes: number;
  platform: string;
  download_url?: string;
}

interface CommunitySharedSavesProps {
  gameId: string;
  gameTitle: string;
}

const CommunitySharedSaves: React.FC<CommunitySharedSavesProps> = ({ gameId }) => {
  const { t } = useTranslation();
  const { error: showError, success } = useToast();
  const [sharedSaves, setSharedSaves] = useState<SharedSave[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch shared saves from server
  const fetchSharedSaves = async () => {
    try {
      setIsLoading(true);
      
      // Fetch from server API
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/shared-saves/${gameId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch shared saves: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSharedSaves(data);
    } catch (err) {
      console.error("Failed to fetch shared saves:", err);
      showError(t("communitySharedSaves.errors.fetchFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSharedSaves();
  }, [gameId]);

  const handleDownload = async (sharedSave: SharedSave) => {
    try {
      setIsDownloading(sharedSave.id);
      
      // Download the file from server
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/shared-saves/download/${sharedSave.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to download save: ${response.statusText}`);
      }
      
      // Get the file data
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Save to local backup directory using Tauri
      const saveDir = await invoke<string>("get_saves_directory_path");
      const gameSaveDir = `${saveDir}/${gameId}`;
      
      // Create directory if it doesn't exist
      await invoke("create_directory", { path: gameSaveDir });
      
      // Generate unique filename for the zip
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const zipFileName = `community_${timestamp}_${sharedSave.file_name}.zip`;
      const zipFilePath = `${gameSaveDir}/${zipFileName}`;
      
      // Write zip file
      await invoke("write_binary_file", {
        path: zipFilePath,
        contents: Array.from(uint8Array)
      });
      
      // Extract the zip file
      const extractDir = `${gameSaveDir}/${sharedSave.id}_extracted`;
      await invoke("extract_zip", {
        zipPath: zipFilePath,
        extractTo: extractDir
      });
      
      // Add to database
      await invoke("add_community_save", {
        gameId: gameId,
        saveName: `Community - ${sharedSave.file_name}`,
        savePath: zipFilePath,
        extractedPath: extractDir
      });
      
      // Update download count on server
      await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/shared-saves/download/${sharedSave.id}/count`, {
        method: 'POST'
      });
      
      success(t("communitySharedSaves.success.downloaded", { fileName: sharedSave.file_name }));
      
      // Refresh the list to update download count
      fetchSharedSaves();
    } catch (err) {
      console.error("Failed to download shared save:", err);
      showError(t("communitySharedSaves.errors.downloadFailed"));
    } finally {
      setIsDownloading(null);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(sharedSaves.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSharedSaves = sharedSaves.slice(startIndex, endIndex);

  return (
    <div className="bg-game-card/50 backdrop-blur-sm rounded-xl p-5 border border-epic-border/50 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">
          {t("communitySharedSaves.title")}
        </h2>
        <button
          onClick={fetchSharedSaves}
          disabled={isLoading}
          className="p-2 rounded-lg bg-epic-hover/50 hover:bg-epic-hover transition-all duration-200"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Shared Saves List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-rog-blue mx-auto mb-2" />
            <p className="text-gray-400">{t("communitySharedSaves.loading")}</p>
          </div>
        ) : sharedSaves.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {t("communitySharedSaves.noSharedSaves")}
          </div>
        ) : (
          <>
            {/* Shared saves for current page */}
            {currentSharedSaves.map((sharedSave) => (
              <SharedSaveItem
                key={sharedSave.id}
                sharedSave={sharedSave}
                onDownload={handleDownload}
                isDownloading={isDownloading === sharedSave.id}
              />
            ))}
            
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-epic-border/50">
                <div className="text-sm text-gray-400">
                  {t("common.pagination.showing", {
                    start: startIndex + 1,
                    end: Math.min(endIndex, sharedSaves.length),
                    total: sharedSaves.length
                  })}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-epic-hover/50 hover:bg-epic-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, index) => {
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
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
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
  );
};

export default CommunitySharedSaves;