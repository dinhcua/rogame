import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { User, Home, History, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../i18n/config";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-game-dark text-primary font-sans">
      {/* Top Status Bar */}
      {/* <div className="fixed top-0 left-0 right-0 bg-black/30 h-12 flex items-center justify-between pl-4.5 z-50">
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center space-x-4 mr-4">
          <button className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <Plus className="w-5 h-5" />
            <span>Add Game</span>
          </button>
          <User className="w-5 h-5" />
          <span>
            {new Date().toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div> */}

      {/* Left Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-16 bg-sidebar border-r border-theme flex flex-col items-center py-10 space-y-8 z-40">
        {/* Profile */}
        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
          <User className="w-6 h-6" />
        </div>

        {/* Navigation Icons */}
        <nav className="flex flex-col items-center space-y-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                isActive ? "bg-rog-blue" : "bg-white/10 hover:bg-white/20"
              }`
            }
            title={t("navigation.home")}
          >
            <Home className="w-6 h-6" />
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                isActive ? "bg-rog-blue" : "bg-white/10 hover:bg-white/20"
              }`
            }
            title={t("navigation.history")}
          >
            <History className="w-6 h-6" />
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                isActive ? "bg-rog-blue" : "bg-white/10 hover:bg-white/20"
              }`
            }
            title={t("navigation.settings")}
          >
            <Settings className="w-6 h-6" />
          </NavLink>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-16 px-8 pb-8">{children}</div>
    </div>
  );
}
