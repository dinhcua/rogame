import React from "react";
import ReactDOM from "react-dom";
import { Loader2, LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../i18n/config";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  icon: LucideIcon;
  iconColor?: "danger" | "warning" | "success" | "info";
  confirmText?: string;
  cancelText?: string;
  confirmButtonVariant?: "danger" | "success" | "primary";
  isLoading?: boolean;
  loadingText?: string;
  children?: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  icon: Icon,
  iconColor = "danger",
  confirmText,
  cancelText,
  confirmButtonVariant = "danger",
  isLoading = false,
  loadingText,
  children,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const iconColorClasses = {
    danger: "bg-epic-danger/20 text-epic-danger",
    warning: "bg-epic-warning/20 text-epic-warning",
    success: "bg-epic-success/20 text-epic-success",
    info: "bg-rog-blue/20 text-rog-blue",
  };

  const buttonVariantClasses = {
    danger: "bg-epic-danger hover:bg-epic-danger/90",
    success: "bg-epic-success hover:bg-epic-success/90",
    primary: "bg-rog-blue hover:bg-epic-accent",
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-game-card rounded-lg p-6 max-w-md w-full mx-4 shadow-xl animate-scale-in">
        <div className="flex items-center justify-center mb-4">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center ${iconColorClasses[iconColor]}`}
          >
            {isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <Icon className="w-8 h-8" />
            )}
          </div>
        </div>

        <h3 className="text-2xl font-bold text-center mb-3 text-white">
          {title}
        </h3>

        <p className="text-gray-400 text-center mb-8 text-lg">{message}</p>

        {children && <div className="mb-6">{children}</div>}

        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 text-white rounded-lg bg-epic-hover hover:bg-epic-hover/80 transition-all duration-200 font-medium ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {cancelText || t("common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 rounded-lg ${
              buttonVariantClasses[confirmButtonVariant]
            } transition-all duration-200 flex items-center justify-center space-x-2 font-medium text-white ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{loadingText || t("common.loading")}</span>
              </>
            ) : (
              <span>{confirmText || t("common.confirm")}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Render the modal at the root level using a portal
  return ReactDOM.createPortal(modalContent, document.body);
};

export default ConfirmationModal;
