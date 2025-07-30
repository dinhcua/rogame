import React from "react";
import { useTranslation } from "react-i18next";
import { Download, User, HardDrive, Loader2, RotateCcw, Users } from "lucide-react";
import { formatFileSize } from "../utils/format";

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

interface SharedSaveItemProps {
  sharedSave: SharedSave;
  onDownload: (sharedSave: SharedSave) => void;
  onRestore?: (sharedSave: SharedSave) => void;
  isDownloading: boolean;
  isRestoring?: boolean;
}

const SharedSaveItem: React.FC<SharedSaveItemProps> = ({
  sharedSave,
  onDownload,
  onRestore,
  isDownloading,
  isRestoring,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-game-card rounded-lg p-3 hover:bg-epic-hover transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-rog-blue/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-rog-blue" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-base text-white">
                {sharedSave.file_name}
              </h4>
              {sharedSave.description && (
                <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">
                  {sharedSave.description}
                </p>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex gap-6 text-sm mb-1">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-gray-300">{sharedSave.uploaded_by}</span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-gray-500" />
              <span className="text-gray-300">
                {formatFileSize(sharedSave.size_bytes)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-4">
          {sharedSave.isDownloaded && onRestore ? (
            // Show only Restore button with same style as backup list
            <button
              onClick={() => onRestore(sharedSave)}
              disabled={isRestoring}
              className="bg-rog-blue px-3 py-1.5 rounded-lg hover:bg-epic-accent transition-all duration-200 font-medium text-sm text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("saveFile.actions.restoring")}
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  {t("saveFile.actions.restore")}
                </>
              )}
            </button>
          ) : (
            // Show Download button when not downloaded
            <button
              onClick={() => onDownload(sharedSave)}
              disabled={isDownloading}
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 font-medium text-sm text-white flex items-center gap-2 ${
                isDownloading
                ? "bg-rog-blue opacity-75"
                : "bg-rog-blue hover:bg-epic-accent"
              }`}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("communitySharedSaves.downloading")}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  {t("communitySharedSaves.download")}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedSaveItem;
