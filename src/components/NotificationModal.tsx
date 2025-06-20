import React from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  type: "success" | "error";
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  message,
  type,
}) => {
  if (!isOpen) return null;

  const bgColor = type === "success" ? "bg-green-500/20" : "bg-red-500/20";
  const textColor = type === "success" ? "text-green-400" : "text-red-400";
  const Icon = type === "success" ? CheckCircle : AlertCircle;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`${bgColor} rounded-lg p-6 max-w-md w-full mx-4`}>
        <div className="flex items-center space-x-4">
          <Icon className={`w-6 h-6 ${textColor}`} />
          <p className={`${textColor} flex-1`}>{message}</p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
