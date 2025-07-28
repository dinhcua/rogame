import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { User, Home, History, Settings, Gamepad2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../i18n/config";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-game-dark text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-14 bg-sidebar flex flex-col z-40">
        {/* Logo */}
        <div className="flex justify-center p-2">
          <div className="size-12 flex items-center justify-center">
            <Gamepad2 className="w-8 h-8" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `relative flex items-center justify-center py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-rog-blue text-white"
                  : "hover:bg-epic-hover text-gray-300 hover:text-white"
              }`
            }
          >
            <Home className="w-5 h-5" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-black/90 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {t("navigation.home")}
            </span>
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `relative flex items-center justify-center py-3 rounded-lg transition-all duration-200 group mt-2 ${
                isActive
                  ? "bg-rog-blue text-white"
                  : "hover:bg-epic-hover text-gray-300 hover:text-white"
              }`
            }
          >
            <History className="w-5 h-5" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-black/90 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {t("navigation.history")}
            </span>
          </NavLink>
        </nav>

        {/* Bottom Section */}
        <div className="p-1">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `relative flex items-center justify-center py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-rog-blue text-white"
                  : "hover:bg-epic-hover text-gray-300 hover:text-white"
              }`
            }
          >
            <Settings className="w-5 h-5" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-black/90 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {t("navigation.settings")}
            </span>
          </NavLink>

          <button className="relative flex items-center justify-center w-full py-3 rounded-lg transition-all duration-200 hover:bg-epic-hover text-gray-300 hover:text-white mt-2 group">
            <User className="w-5 h-5" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-black/90 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              Profile
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-14 h-screen overflow-y-auto">
        <div className="">{children}</div>
      </div>
    </div>
  );
}
