import React from "react";
import { useTranslation } from "react-i18next";
import { Download, User, HardDrive, Loader2 } from "lucide-react";
import PlatformIcon from "./PlatformIcon";
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
  isDownloading: boolean;
}

const SharedSaveItem: React.FC<SharedSaveItemProps> = ({
  sharedSave,
  onDownload,
  isDownloading,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-game-card rounded-lg p-3 hover:bg-epic-hover transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-rog-blue/10 rounded-lg flex items-center justify-center">
              <PlatformIcon
                platform={sharedSave.platform}
                className="w-5 h-5"
              />
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

        {/* Download Button */}
        <button
          onClick={() => onDownload(sharedSave)}
          disabled={isDownloading || sharedSave.isDownloaded}
          className={`ml-4 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            sharedSave.isDownloaded 
              ? "bg-green-600 cursor-default" 
              : "bg-rog-blue hover:bg-epic-accent"
          }`}
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("communitySharedSaves.downloading")}
            </>
          ) : sharedSave.isDownloaded ? (
            <>
              <Download className="w-4 h-4" />
              {t("communitySharedSaves.downloaded")}
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              {t("communitySharedSaves.download")}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SharedSaveItem;
