import React, { useState } from "react";
import {
  Clock,
  HardDrive,
  Trash2,
  FolderOpen,
  FolderInput,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import "../i18n/config";

interface SaveFile {
  id: string;
  game_id: string;
  file_name: string;
  created_at: string;
  modified_at: string;
  size_bytes: number;
  tags: string[];
  file_path?: string;
  origin_path?: string; // Add origin path
}

interface SaveFileItemProps {
  saveFile: SaveFile;
  onRestore: (saveFile: SaveFile) => void;
  onDelete: (saveFile: SaveFile) => void;
  isDeleting?: boolean;
}

const SaveFileItem: React.FC<SaveFileItemProps> = ({
  saveFile,
  onRestore,
  onDelete,
  isDeleting = false,
}) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  const formatSize = (bytes: number) => {
    const sizes = ["B", "KB", "MB", "GB"];
    let i = 0;
    let size = bytes;

    while (size >= 1024 && i < sizes.length - 1) {
      size /= 1024;
      i++;
    }

    return `${size.toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const handleOpenOriginalLocation = async () => {
    if (!saveFile.origin_path) return;
    try {
      // For mock saves, this will open the Steam saves directory
      await revealItemInDir(saveFile.origin_path);
    } catch (error) {
      console.error("Failed to open original save location:", error);
    }
  };

  const handleOpenLocation = async () => {
    if (!saveFile.file_path) return;
    try {
      await revealItemInDir(saveFile.file_path);
    } catch (error) {
      console.error("Failed to open backup location:", error);
    }
  };

  return (
    <div
      className="bg-black/20 rounded-lg p-4 hover:bg-black/30 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{saveFile.file_name}</h4>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onRestore(saveFile)}
            className={`${
              isHovered ? "opacity-100" : "opacity-0"
            } bg-blue-500/20 p-2 rounded hover:bg-blue-500/30 transition-all`}
          >
            {t("saveFile.actions.restore")}
          </button>
          {saveFile.origin_path && (
            <button
              onClick={handleOpenOriginalLocation}
              className={`${
                isHovered ? "opacity-100" : "opacity-0"
              } bg-purple-500/20 p-2 rounded hover:bg-purple-500/30 transition-all`}
              title={t("saveFile.actions.openOriginalLocation")}
            >
              <FolderInput className="w-5 h-5 text-purple-400" />
            </button>
          )}
          {saveFile.file_path && (
            <button
              onClick={handleOpenLocation}
              className={`${
                isHovered ? "opacity-100" : "opacity-0"
              } bg-gray-500/20 p-2 rounded hover:bg-gray-500/30 transition-all`}
              title={t("saveFile.actions.openBackupLocation")}
            >
              <FolderOpen className="w-5 h-5 text-gray-400" />
            </button>
          )}
          <button
            onClick={() => onDelete(saveFile)}
            disabled={isDeleting}
            className={`${
              isHovered ? "opacity-100" : "opacity-0"
            } bg-red-500/20 p-2 rounded hover:bg-red-500/30 transition-all ${
              isDeleting ? "cursor-not-allowed opacity-50" : ""
            }`}
            title={t("saveFile.actions.delete")}
          >
            <Trash2 className="w-5 h-5 text-red-500" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>{formatDate(saveFile.modified_at)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <HardDrive className="w-4 h-4" />
          <span>{formatSize(saveFile.size_bytes)}</span>
        </div>
      </div>
    </div>
  );
};

export default SaveFileItem;
