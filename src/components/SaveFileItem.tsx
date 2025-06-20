import React, { useState } from "react";
import { Clock, HardDrive, Trash2 } from "lucide-react";

interface SaveFile {
  id: string;
  game_id: string;
  file_name: string;
  created_at: string;
  modified_at: string;
  size_bytes: number;
  tags: string[];
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
            Restore
          </button>
          <button
            onClick={() => onDelete(saveFile)}
            disabled={isDeleting}
            className={`${
              isHovered ? "opacity-100" : "opacity-0"
            } bg-red-500/20 p-2 rounded hover:bg-red-500/30 transition-all ${
              isDeleting ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            <Trash2 className="w-5 h-5 text-red-500" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>{saveFile.modified_at}</span>
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
