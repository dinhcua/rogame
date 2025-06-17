import React from "react";

interface SaveFileItemProps {
  // Add props as needed
}

const SaveFileItem: React.FC<SaveFileItemProps> = () => {
  return (
    <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="font-medium">Save File 1</h3>
            <div className="flex items-center space-x-2">
              <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full text-xs">
                Boss Fight
              </span>
              <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs">
                Achievement
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            Last modified: March 15, 2024 - 14:30
          </p>
          <p className="text-sm text-gray-400 mt-1">Size: 1.2 MB</p>
        </div>
        <div className="flex items-start space-x-2">
          <button className="bg-white/10 p-2 rounded-lg hover:bg-white/20 group relative">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span className="absolute bg-black/90 text-white text-xs px-2 py-1 rounded -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Manage Tags
            </span>
          </button>
          <button className="bg-white/10 p-2 rounded-lg hover:bg-white/20 group relative">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            <span className="absolute bg-black/90 text-white text-xs px-2 py-1 rounded -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Share
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveFileItem;
