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
  isDownloaded?: boolean;
  localPath?: string;
}

interface CommunitySharedSavesProps {
  gameId: string;
  gameTitle: string;
}

const CommunitySharedSaves: React.FC<CommunitySharedSavesProps> = ({ gameId, gameTitle }) => {
  const { t } = useTranslation();
  const { error: showError, success } = useToast();
  const [sharedSaves, setSharedSaves] = useState<SharedSave[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [downloadedSaveIds, setDownloadedSaveIds] = useState<Set<string>>(new Set());
  const itemsPerPage = 4;

  // Load downloaded saves from local database
  const loadDownloadedSaves = async () => {
    try {
      const localSaves = await invoke<any[]>("get_community_saves", { gameId });
      const downloadedIds = new Set(localSaves.map(save => save.id));
      setDownloadedSaveIds(downloadedIds);
      return localSaves;
    } catch (err) {
      console.error("Failed to load downloaded saves:", err);
      return [];
    }
  };

  // Fetch shared saves from server
  const fetchSharedSaves = async () => {
    try {
      setIsLoading(true);
      
      // First, load downloaded saves from local database
      const localSaves = await loadDownloadedSaves();
      // Create a Set from local saves for quick lookup
      const localSaveIds = new Set(localSaves.map(save => save.id));
      
      try {
        // Try to fetch from server API
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/shared-saves/${gameId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch shared saves: ${response.statusText}`);
        }
        
        const serverSaves = await response.json();
        
        // Merge server saves with download status
        const mergedSaves = serverSaves.map((save: SharedSave) => ({
          ...save,
          isDownloaded: localSaveIds.has(save.id),
          localPath: localSaves.find(local => local.id === save.id)?.local_path
        }));
        
        // Add any local saves that aren't in server response (offline saves)
        const serverIds = new Set(serverSaves.map((s: SharedSave) => s.id));
        const offlineSaves = localSaves
          .filter(local => !serverIds.has(local.id))
          .map(local => ({
            id: local.id,
            game_id: local.game_id,
            game_title: gameTitle,
            file_name: local.save_name,
            description: local.description || "",
            uploaded_by: local.uploaded_by,
            uploaded_at: local.uploaded_at,
            download_count: 0,
            size_bytes: 0,
            platform: "pc",
            isDownloaded: true,
            localPath: local.local_path
          }));
        
        setSharedSaves([...mergedSaves, ...offlineSaves]);
      } catch (err) {
        // If server is offline, show only downloaded saves
        console.error("Server offline, showing downloaded saves only:", err);
        const offlineSaves = localSaves.map(local => ({
          id: local.id,
          game_id: local.game_id,
          game_title: gameTitle,
          file_name: local.save_name,
          description: local.description || "",
          uploaded_by: local.uploaded_by,
          uploaded_at: local.uploaded_at,
          download_count: 0,
          size_bytes: 0,
          platform: "pc",
          isDownloaded: true,
          localPath: local.local_path
        }));
        setSharedSaves(offlineSaves);
      }
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
      
      // Save to community_saves table only (not to save_files)
      await invoke("save_community_download", {
        id: sharedSave.id,
        gameId: gameId,
        saveName: sharedSave.file_name,
        description: sharedSave.description || null,
        uploadedBy: sharedSave.uploaded_by,
        uploadedAt: sharedSave.uploaded_at,
        localPath: extractDir,
        zipPath: zipFilePath,
        saveFileId: null // No save file ID since we're not adding to save_files
      });
      
      // Update download count on server (don't wait for it)
      fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/shared-saves/download/${sharedSave.id}/count`, {
        method: 'POST'
      }).catch(err => console.error("Failed to update download count:", err));
      
      success(t("communitySharedSaves.success.downloaded", { fileName: sharedSave.file_name }));
      
      // Refresh the list to update download status
      fetchSharedSaves();
    } catch (err) {
      console.error("Failed to download shared save:", err);
      showError(t("communitySharedSaves.errors.downloadFailed"));
    } finally {
      setIsDownloading(null);
    }
  };

  const handleRestore = async (sharedSave: SharedSave) => {
    if (!sharedSave.localPath) {
      showError(t("communitySharedSaves.errors.noLocalPath"));
      return;
    }
    
    try {
      setIsRestoring(sharedSave.id);
      
      // Use the new restore_community_save command
      await invoke("restore_community_save", {
        gameId: gameId,
        communitySaveId: sharedSave.id
      });
      
      success(t("gameDetail.success.saveRestored", { fileName: sharedSave.file_name }));
    } catch (err) {
      console.error("Failed to restore community save:", err);
      showError(t("gameDetail.errors.restoreFailed", { error: String(err) }));
    } finally {
      setIsRestoring(null);
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
                onRestore={handleRestore}
                isDownloading={isDownloading === sharedSave.id}
                isRestoring={isRestoring === sharedSave.id}
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