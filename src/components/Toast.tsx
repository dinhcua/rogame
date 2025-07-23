import React, { useEffect } from "react";
import { CheckCircle, XCircle, Info, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type,
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-400" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-900/80 border-green-600";
      case "error":
        return "bg-red-900/80 border-red-600";
      case "info":
        return "bg-blue-900/80 border-blue-600";
      case "warning":
        return "bg-yellow-900/80 border-yellow-600";
    }
  };

  return (
    <div
      className={`${getBackgroundColor()} border rounded-lg p-4 flex items-center justify-between min-w-[300px] max-w-md shadow-lg backdrop-blur-sm animate-slide-in`}
    >
      <div className="flex items-center space-x-3">
        {getIcon()}
        <p className="text-white">{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;