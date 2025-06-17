import { ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-game-dark text-white font-sans">
      {/* Top Status Bar */}
      <div className="fixed top-0 left-0 right-0 bg-black/30 h-12 flex items-center justify-between pl-4.5 z-50">
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
        <div className="flex items-center space-x-4 mr-4">
          <button className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>Add Game</span>
          </button>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6z" />
          </svg>
          <span>
            {new Date().toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* Left Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-16 bg-sidebar flex flex-col items-center py-10 space-y-8 z-40">
        {/* Profile */}
        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
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
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                isActive ? "bg-rog-blue" : "bg-white/10 hover:bg-white/20"
              }`
            }
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                isActive ? "bg-rog-blue" : "bg-white/10 hover:bg-white/20"
              }`
            }
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
          </NavLink>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-16 pt-12 px-8 pb-8">{children}</div>
    </div>
  );
}
