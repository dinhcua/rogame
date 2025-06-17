import React, { useState } from "react";
import DropdownSelect from "../components/DropdownSelect";
import SaveFileItem from "../components/SaveFileItem";
import BackupSettings from "../components/BackupSettings";
import CloudStorage from "../components/CloudStorage";
import StorageInfo from "../components/StorageInfo";

interface GameDetailProps {
  // Add props as needed
}

const GameDetail: React.FC<GameDetailProps> = () => {
  const [selectedTag, setSelectedTag] = useState("all");

  const tagOptions = [
    { value: "all", label: "All Files" },
    { value: "boss_fight", label: "Boss Fight (3)" },
    { value: "achievement", label: "Achievement (5)" },
    { value: "story", label: "Story (2)" },
    { value: "checkpoint", label: "Checkpoint (4)" },
  ];

  return (
    <div>
      {/* Game Header */}
      <div className="relative h-[500px]">
        <img
          src="https://images.igdb.com/igdb/image/upload/t_1080p/sc8bj6.jpg"
          alt="Game Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-game-dark via-game-dark/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center">
              <img
                src="https://images.igdb.com/igdb/image/upload/t_cover_big/co5nng.jpg"
                alt="Game Cover"
                className="w-40 h-52 rounded-lg mr-8 shadow-2xl"
              />
              <div>
                <h1 className="text-5xl font-bold mb-2">Hollow Knight</h1>
                <p className="text-xl text-gray-300 mb-6">Save Files Manager</p>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {}}
                    className="bg-green-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-green-500 transition-colors"
                  >
                    Backup Save
                  </button>
                  <button
                    onClick={() => {}}
                    className="bg-blue-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-500 transition-colors"
                  >
                    Restore Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="col-span-8 space-y-8">
            {/* Save Details Section */}
            <div className="bg-game-card rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-4">Save Details</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-gray-400 mb-2">Last Backup</h3>
                  <p>March 15, 2024 - 14:30</p>
                </div>
                <div>
                  <h3 className="text-gray-400 mb-2">Save Location</h3>
                  <p>C:/Users/AppData/Hollow Knight/Saves</p>
                </div>
                <div>
                  <h3 className="text-gray-400 mb-2">Total Saves</h3>
                  <p>3 Save Files</p>
                </div>
                <div>
                  <h3 className="text-gray-400 mb-2">Auto-Backup</h3>
                  <p>Enabled (Every 30 mins)</p>
                </div>
              </div>
            </div>

            {/* Save Files Section */}
            <div className="bg-game-card rounded-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Save Files</h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {}}
                    className="bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center space-x-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Manage Tags</span>
                  </button>
                  <button
                    onClick={() => {}}
                    className="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors flex items-center space-x-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Manage All</span>
                  </button>
                </div>
              </div>

              {/* Tag Filters */}
              <div className="mb-6">
                <DropdownSelect
                  options={tagOptions}
                  value={selectedTag}
                  onChange={setSelectedTag}
                  placeholder="Filter by tag"
                  className="w-48"
                  icon={
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                />
              </div>

              {/* Save Files List */}
              <div className="space-y-4">
                <SaveFileItem />
                <SaveFileItem />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-4 space-y-8">
            <BackupSettings />
            <CloudStorage />
            <StorageInfo />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetail;
