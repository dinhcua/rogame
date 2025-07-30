import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import DropdownPortal from "./DropdownPortal";
import { MoreVertical, FolderOpen, FolderInput, Trash2 } from "lucide-react";
import { useToast } from "../hooks/useToast";
// import { useServerUpload } from "../hooks/useServerUpload"; // Currently disabled
import { useCloudStorage } from "../hooks/useCloudStorage";
import PlatformIcon from "./PlatformIcon";
import { CloudProvider } from "../types/cloud";

interface BackupActionDropdownProps {
  gameId: string;
  gameTitle: string;
  saveId: string;
  saveFileName: string;
  saveFilePath: string;
  saveModifiedAt: string;
  currentCloudProvider?: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onAfterDelete?: () => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
}

export default function BackupActionDropdown({
  gameId,
  gameTitle,
  saveId,
  saveFileName,
  saveFilePath,
  saveModifiedAt,
  currentCloudProvider,
  isOpen,
  onToggle,
  onAfterDelete,
  onUploadStart,
  onUploadEnd,
}: BackupActionDropdownProps) {
  const { t } = useTranslation();
  const { error, success } = useToast();
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  // const { uploadFile } = useServerUpload(); // Currently disabled
  const {
    isProviderConnected,
    getProviderName,
    uploadGameSaves,
    isLoading: isCloudUploading,
  } = useCloudStorage();

  // Upload to server function (currently disabled)
  // const handleUploadToServer = async () => {
  //   onToggle();
  //   try {
  //     await uploadFile(saveFilePath, saveFileName);
  //     // Toast is already shown by useServerUpload hook
  //   } catch (err) {
  //     // Error toast is already shown by useServerUpload hook
  //   }
  // };

  const handleUploadToCloud = async (provider: CloudProvider) => {
    onToggle();
    if (onUploadStart) onUploadStart();
    
    try {
      // Read the backup file
      const fileData = await invoke<number[]>("read_file_as_bytes", {
        filePath: saveFilePath,
      });

      // Convert to File object
      const uint8Array = new Uint8Array(fileData);
      const blob = new Blob([uint8Array]);
      const file = new File([blob], saveFileName, {
        lastModified: new Date(saveModifiedAt).getTime(),
      });

      await uploadGameSaves(provider, gameId, gameTitle, [file]);
      
      // Update cloud status in database
      await invoke("update_save_cloud_status", {
        gameId: gameId,
        saveId: saveId,
        cloudProvider: provider,
      });
      
      // Toast is already shown by useCloudStorage hook
    } catch (err) {
      console.error("Failed to upload to cloud:", err);
      // Error toast is already shown by useCloudStorage hook
    } finally {
      if (onUploadEnd) onUploadEnd();
    }
  };

  const handleOpenOriginalLocation = async () => {
    onToggle();
    try {
      await invoke("open_save_location", {
        gameId: gameId,
        backup: false,
      });
    } catch (err) {
      error(t("history.notifications.openLocationError") || "Failed to open save location");
    }
  };

  const handleOpenBackupLocation = async () => {
    onToggle();
    try {
      await invoke("open_save_location", {
        gameId: gameId,
        backup: true,
      });
    } catch (err) {
      error(t("history.notifications.openLocationError") || "Failed to open backup location");
    }
  };

  const handleDelete = async () => {
    onToggle();
    if (confirm(t("history.confirmDelete") || "Are you sure you want to delete this save file?")) {
      try {
        await invoke("delete_save", {
          gameId: gameId,
          saveId: saveId,
        });
        success(t("history.notifications.deleteSuccess") || "Save file deleted successfully");
        if (onAfterDelete) {
          onAfterDelete();
        }
      } catch (err) {
        error(t("history.notifications.deleteError") || "Failed to delete save file");
      }
    }
  };

  return (
    <>
      <button
        ref={dropdownButtonRef}
        onClick={onToggle}
        className="p-3 rounded-lg hover:bg-epic-hover transition-colors flex-shrink-0"
      >
        <MoreVertical className="w-4 h-4 text-gray-400" />
      </button>
      <DropdownPortal targetRef={dropdownButtonRef} isOpen={isOpen} onClose={onToggle}>
        {/* Temporarily hidden server upload button */}
        {/* <button
          className="w-full px-4 py-3 text-left hover:bg-epic-hover transition-colors flex items-center gap-3 text-sm border-b border-epic-border/30"
          onClick={handleUploadToServer}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-300">{t("history.actions.uploading") || "Uploading..."}</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300">{t("history.actions.uploadToServer")}</span>
            </>
          )}
        </button> */}

        {/* Cloud Provider Upload Buttons */}
        {(["google_drive", "dropbox", "onedrive"] as CloudProvider[]).map((provider) => {
          const isConnected = isProviderConnected(provider);
          const isAlreadyUploaded = currentCloudProvider === provider;
          
          // Don't show the button if not connected or already uploaded to this provider
          if (!isConnected || isAlreadyUploaded) return null;

          return (
            <button
              key={provider}
              className="w-full px-4 py-3 text-left hover:bg-epic-hover transition-colors flex items-center gap-3 text-sm border-b border-epic-border/30"
              onClick={() => handleUploadToCloud(provider)}
              disabled={isCloudUploading}
            >
              {isCloudUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-300">{t("history.actions.uploading")}</span>
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
          onClick={handleOpenOriginalLocation}
        >
          <FolderInput className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300">{t("history.actions.openOriginalLocation")}</span>
        </button>
        <button
          className="w-full px-4 py-3 text-left hover:bg-epic-hover transition-colors flex items-center gap-3 text-sm"
          onClick={handleOpenBackupLocation}
        >
          <FolderOpen className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300">{t("history.actions.openBackupLocation")}</span>
        </button>
        <button
          className="w-full px-4 py-3 text-left hover:bg-epic-danger/20 transition-colors flex items-center gap-3 text-sm text-epic-danger"
          onClick={handleDelete}
        >
          <Trash2 className="w-4 h-4" />
          <span>{t("history.actions.deleteSaveFile")}</span>
        </button>
      </DropdownPortal>
    </>
  );
}