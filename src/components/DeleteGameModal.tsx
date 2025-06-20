import React from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../i18n/config";

interface DeleteGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  gameTitle: string;
  includeSaveFiles: boolean;
  setIncludeSaveFiles: (include: boolean) => void;
  isDeleting?: boolean;
  error?: string | null;
}

const DeleteGameModal: React.FC<DeleteGameModalProps> = ({
  isOpen,
  onClose,
  onDelete,
  gameTitle,
  includeSaveFiles,
  setIncludeSaveFiles,
  isDeleting = false,
  error = null,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-game-card rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            {isDeleting ? (
              <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
            ) : (
              <Trash2 className="w-6 h-6 text-red-500" />
            )}
          </div>
        </div>
        <h3 className="text-xl font-bold text-center mb-2">
          {t("deleteGameModal.title")}
        </h3>
        <p className="text-gray-400 text-center mb-6">
          {t("deleteGameModal.confirmation", { gameTitle })}
        </p>

        <div className="mb-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSaveFiles}
              onChange={(e) => setIncludeSaveFiles(e.target.checked)}
              disabled={isDeleting}
              className="w-4 h-4 rounded border-gray-600 text-rog-blue focus:ring-rog-blue bg-transparent disabled:opacity-50"
            />
            <span className="text-sm text-gray-300">
              {t("deleteGameModal.includeSaveFiles")}
            </span>
          </label>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className={`flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors ${
              isDeleting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className={`flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center space-x-2 ${
              isDeleting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t("deleteGameModal.deleting")}</span>
              </>
            ) : (
              <span>{t("deleteGameModal.deleteButton")}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteGameModal;
