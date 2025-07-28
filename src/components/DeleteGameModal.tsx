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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-game-card rounded-lg p-6 max-w-md w-full mx-4 shadow-xl animate-scale-in">
        <div className="flex items-center justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-epic-danger/20 flex items-center justify-center">
            {isDeleting ? (
              <Loader2 className="w-8 h-8 text-epic-danger animate-spin" />
            ) : (
              <Trash2 className="w-8 h-8 text-epic-danger" />
            )}
          </div>
        </div>
        <h3 className="text-2xl font-bold text-center mb-3">
          {t("deleteGameModal.title")}
        </h3>
        <p className="text-gray-400 text-center mb-8 text-lg">
          {t("deleteGameModal.confirmation", { gameTitle })}
        </p>

        <div className="mb-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSaveFiles}
              onChange={(e) => setIncludeSaveFiles(e.target.checked)}
              disabled={isDeleting}
              className="w-5 h-5 rounded border-gray-600 text-rog-blue focus:ring-rog-blue focus:ring-offset-2 focus:ring-offset-game-card bg-transparent disabled:opacity-50 cursor-pointer"
            />
            <span className="text-base text-gray-300">
              {t("deleteGameModal.includeSaveFiles")}
            </span>
          </label>
        </div>

        {error && (
          <div className="bg-epic-danger/10 border border-epic-danger/20 rounded-lg p-3 mb-4">
            <p className="text-epic-danger text-sm text-center">{error}</p>
          </div>
        )}

        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className={`flex-1 px-4 py-2 rounded-lg bg-epic-hover hover:bg-epic-hover/80 transition-all duration-200 font-medium ${
              isDeleting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className={`flex-1 px-4 py-2 rounded-lg bg-epic-danger hover:bg-epic-danger/90 transition-all duration-200 flex items-center justify-center space-x-2 font-medium ${
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
