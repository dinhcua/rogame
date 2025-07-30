import React, { useState } from "react";
import {
  Clock,
  HardDrive,
  Trash2,
  FolderOpen,
  FolderInput,
  Upload,
  Save,
  FileText,
  MoreVertical,
  Loader2,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import ConfirmationModal from "./ConfirmationModal";
import { useCloudStorage } from "../hooks/useCloudStorage";
import { CloudProvider } from "../types/cloud";
import PlatformIcon from "./PlatformIcon";
import { invoke } from "@tauri-apps/api/core";
import { useToast } from "../hooks/useToast";
import { formatFileSize, formatDate, getDisplayName } from "../utils/format";
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

interface SaveFileItemProps {
  saveFile: SaveFile;
  onRestore: (saveFile: SaveFile) => void;
  onDelete: (saveFile: SaveFile) => void;
  onUpload?: (saveFile: SaveFile) => Promise<void>;
  isDeleting?: boolean;
  isUploading?: boolean;
}

const SaveFileItem: React.FC<SaveFileItemProps> = ({
  saveFile,
  onRestore,
  onDelete,
  onUpload,
  isDeleting = false,
}) => {
  const { t, i18n } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success"
  >("idle");
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const {
    isProviderConnected,
    getProviderName,
    uploadGameSaves,
    isLoading: isCloudUploading,
  } = useCloudStorage();
  const [uploadingProvider, setUploadingProvider] =
    useState<CloudProvider | null>(null);
  const [cloudStatus, setCloudStatus] = useState<string | null>(
    saveFile.cloud || null
  );
  const { success, error } = useToast();

  // Extract date from backup filename
  const getBackupDate = (fileName: string): Date | null => {
    const match = fileName.match(/backup_(\d{8})_(\d{6})/);
    if (match) {
      const dateStr = match[1];
      const timeStr = match[2];
      const year = dateStr.slice(0, 4);
      const month = dateStr.slice(4, 6);
      const day = dateStr.slice(6, 8);
      const hour = timeStr.slice(0, 2);
      const minute = timeStr.slice(2, 4);
      const second = timeStr.slice(4, 6);

      return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    }
    return null;
  };

  const handleOpenOriginalLocation = async () => {
    if (!saveFile.origin_path || saveFile.origin_path.trim() === "") return;
    try {
      await revealItemInDir(saveFile.origin_path);
    } catch (error) {
      console.error("Failed to open original save location:", error);
    }
  };

  const handleOpenLocation = async () => {
    if (!saveFile.file_path || saveFile.file_path.trim() === "") return;
    try {
      await revealItemInDir(saveFile.file_path);
    } catch (error) {
      console.error("Failed to open backup location:", error);
    }
  };

  const handleUpload = async () => {
    if (!onUpload) return;

    setUploadStatus("uploading");
    try {
      await onUpload(saveFile);
      setUploadStatus("success");
      setTimeout(() => setUploadStatus("idle"), 3000);
    } catch (error) {
      setUploadStatus("idle");
    }
  };

  return (
    <div className="bg-game-card rounded-lg p-3 hover:bg-epic-hover transition-all duration-200 group">
      {/* Main Content */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-rog-blue/10 rounded-lg flex items-center justify-center">
              <Save className="w-5 h-5 text-rog-blue" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-base text-white">
                {saveFile.file_name}
              </h4>
              <p className="text-sm text-gray-400 mt-0.5">
                {getDisplayName(saveFile.file_name, t, i18n)}
              </p>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Always visible primary action */}
              <button
                onClick={() => setShowRestoreConfirm(true)}
                className="bg-rog-blue px-3 py-1.5 rounded-lg hover:bg-epic-accent transition-all duration-200 font-medium text-sm text-white"
              >
                {t("saveFile.actions.restore")}
              </button>

              {/* More actions menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="opacity-100 p-2 rounded-lg hover:bg-epic-hover transition-all duration-200"
                >
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-game-card rounded-lg shadow-2xl border border-epic-border py-2">
                    {onUpload && (
                      <button
                        onClick={async () => {
                          setShowMenu(false);
                          await handleUpload();
                        }}
                        disabled={uploadStatus === "uploading"}
                        className="w-full px-4 py-2.5 text-left hover:bg-epic-hover transition-colors flex items-center gap-3 text-sm"
                      >
                        {uploadStatus === "uploading" ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rog-blue" />
                        ) : uploadStatus === "success" ? (
                          <CheckCircle className="w-4 h-4 text-epic-success" />
                        ) : (
                          <Upload className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-gray-300">
                          {uploadStatus === "uploading"
                            ? t("saveFile.uploading")
                            : uploadStatus === "success"
                            ? t("saveFile.uploaded")
                            : t("saveFile.actions.uploadToServer")}
                        </span>
                      </button>
                    )}

                    {/* Cloud Provider Upload Buttons */}
                    {/* Temporarily only show Google Drive */}
                    {(["google_drive"] as CloudProvider[]).map((provider) => {
                      const isConnected = isProviderConnected(provider);
                      if (!isConnected) return null;

                      return (
                        <button
                          key={provider}
                          onClick={async () => {
                            setShowMenu(false);
                            setUploadingProvider(provider);
                            try {
                              // Read the backup file
                              const fileData = await invoke<number[]>(
                                "read_file_as_bytes",
                                {
                                  filePath: saveFile.file_path,
                                }
                              );

                              // Convert to File object
                              const uint8Array = new Uint8Array(fileData);
                              const blob = new Blob([uint8Array]);

                              // If the original backup was a directory, the server will have created a zip
                              // So we should change the filename to include .zip extension
                              let fileName = saveFile.file_name;
                              if (!fileName.toLowerCase().endsWith(".zip")) {
                                // Check if it was originally a directory by looking at the backup name pattern
                                // Directory backups are named like "backup_20250728_141201" without extension
                                if (fileName.match(/^backup_\d{8}_\d{6}$/)) {
                                  fileName = `${fileName}.zip`;
                                }
                              }

                              // Get game info
                              const gameInfo = await invoke<any>(
                                "get_game_by_id",
                                {
                                  id: saveFile.game_id,
                                }
                              );

                              // Upload to rogame folder in cloud provider
                              const rogameFile = new File([blob], fileName, {
                                lastModified: new Date(
                                  saveFile.modified_at
                                ).getTime(),
                                // Add custom path to indicate it should go to rogame folder
                                type: "application/octet-stream",
                              });

                              await uploadGameSaves(
                                provider,
                                saveFile.game_id,
                                `rogame/${gameInfo.title}`, // Upload to rogame/GameName folder
                                [rogameFile]
                              );

                              // Update cloud status in database
                              await invoke("update_save_cloud_status", {
                                gameId: saveFile.game_id,
                                saveId: saveFile.id,
                                cloudProvider: provider,
                              });

                              // Update local state
                              setCloudStatus(provider);

                              success(
                                t("saveFile.uploadedToCloud", {
                                  provider: getProviderName(provider),
                                })
                              );
                            } catch (err) {
                              console.error("Failed to upload to cloud:", err);
                              error(
                                t("saveFile.uploadToCloudFailed", {
                                  provider: getProviderName(provider),
                                })
                              );
                            } finally {
                              setUploadingProvider(null);
                            }
                          }}
                          disabled={
                            isCloudUploading && uploadingProvider === provider
                          }
                          className="w-full px-4 py-2.5 text-left hover:bg-epic-hover transition-colors flex items-center gap-3 text-sm"
                        >
                          {isCloudUploading &&
                          uploadingProvider === provider ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rog-blue" />
                          ) : (
                            <PlatformIcon
                              platform={provider}
                              className="w-4 h-4"
                            />
                          )}
                          <span className="text-gray-300">
                            {isCloudUploading && uploadingProvider === provider
                              ? t("saveFile.uploading")
                              : t("saveFile.uploadToProvider", {
                                  provider: getProviderName(provider),
                                })}
                          </span>
                        </button>
                      );
                    })}

                    {saveFile.origin_path &&
                      saveFile.origin_path.trim() !== "" && (
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            handleOpenOriginalLocation();
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-epic-hover transition-colors flex items-center gap-3 text-sm"
                        >
                          <FolderInput className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">
                            {t("saveFile.actions.openOriginalLocation")}
                          </span>
                        </button>
                      )}

                    {saveFile.file_path && saveFile.file_path.trim() !== "" && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          handleOpenLocation();
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-epic-hover transition-colors flex items-center gap-3 text-sm"
                      >
                        <FolderOpen className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">
                          {t("saveFile.actions.openBackupLocation")}
                        </span>
                      </button>
                    )}

                    <div className="border-t border-epic-border my-2"></div>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(saveFile);
                      }}
                      disabled={isDeleting}
                      className="w-full px-4 py-2.5 text-left hover:bg-epic-danger/10 transition-colors flex items-center gap-3 text-sm"
                    >
                      <Trash2 className="w-4 h-4 text-epic-danger" />
                      <span className="text-epic-danger">
                        {t("saveFile.actions.delete")}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-300">
                {(() => {
                  const backupDate = getBackupDate(saveFile.file_name);
                  return backupDate
                    ? formatDate(backupDate, t, i18n)
                    : formatDate(saveFile.created_at, t, i18n);
                })()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-gray-500" />
              <span className="text-gray-300">
                {formatFileSize(saveFile.size_bytes)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {uploadingProvider ? (
                <>
                  <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                  <span className="text-gray-300">
                    {t("saveFile.uploadingTo", {
                      provider: getProviderName(uploadingProvider),
                    })}
                  </span>
                </>
              ) : cloudStatus ? (
                <>
                  <PlatformIcon
                    platform={cloudStatus as CloudProvider}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-300">
                    {getProviderName(cloudStatus as CloudProvider)}
                  </span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-300">
                    {t("saveFile.autoBackup")}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Restore Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRestoreConfirm}
        onClose={() => setShowRestoreConfirm(false)}
        onConfirm={() => {
          setShowRestoreConfirm(false);
          onRestore(saveFile);
        }}
        title={t("saveFile.restoreConfirm.title")}
        message={t("saveFile.restoreConfirm.message")}
        icon={RotateCcw}
        iconColor="success"
        confirmText={t("saveFile.restoreConfirm.confirm")}
        confirmButtonVariant="success"
      >
        <div className="bg-epic-hover/50 rounded-lg p-3">
          <p className="text-sm text-gray-400 mb-1">
            {t("saveFile.restoreConfirm.fileName")}:
          </p>
          <p className="text-white font-medium">{saveFile.file_name}</p>
          <p className="text-sm text-gray-400 mt-2">
            {t("saveFile.restoreConfirm.created")}:{" "}
            {(() => {
              const backupDate = getBackupDate(saveFile.file_name);
              return backupDate
                ? formatDate(backupDate, t, i18n)
                : formatDate(saveFile.created_at, t, i18n);
            })()}
          </p>
        </div>
      </ConfirmationModal>
    </div>
  );
};

export default SaveFileItem;
