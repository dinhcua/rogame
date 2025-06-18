import React from "react";
import { formatDistanceToNow } from "date-fns";
import { X, AlertTriangle } from "lucide-react";

interface SaveFile {
  id: string;
  game_id: string;
  file_name: string;
  created_at: string;
  modified_at: string;
  size_bytes: number;
  tags: string[];
}

interface RestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (saveFile: SaveFile) => void;
  saveFiles: SaveFile[];
  selectedSaveId: string | null;
  onSelectSave: (saveId: string) => void;
}

const RestoreModal: React.FC<RestoreModalProps> = ({
  isOpen,
  onClose,
  onRestore,
  saveFiles,
  selectedSaveId,
  onSelectSave,
}) => {
  if (!isOpen) return null;

  const formatFileSize = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-game-card rounded-lg w-full max-w-lg p-6 m-4 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Restore Save File</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {saveFiles.map((saveFile) => (
              <div
                key={saveFile.id}
                className={`bg-white/5 rounded-lg p-4 hover:bg-white/10 cursor-pointer transition-colors ${
                  selectedSaveId === saveFile.id ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => onSelectSave(saveFile.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg">
                      {saveFile.file_name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Created:{" "}
                      {formatDistanceToNow(new Date(saveFile.created_at))} ago
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Size: {formatFileSize(saveFile.size_bytes)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestore(saveFile);
                      }}
                      className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500"
                    >
                      Restore
                    </button>
                  </div>
                </div>
                {saveFile.tags.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {saveFile.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <span className="text-sm text-yellow-500">
                Restoring a save will overwrite your current game progress
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestoreModal;
