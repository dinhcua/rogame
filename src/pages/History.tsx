import React, { useState } from "react";
import DropdownSelect from "../components/DropdownSelect";

interface BackupItem {
  id: string;
  game: {
    name: string;
    image: string;
  };
  saveName: string;
  createdAt: string;
  size: string;
  syncStatus: "synced" | "syncing" | "not_synced";
  description: string;
}

const mockBackups: BackupItem[] = [
  {
    id: "1",
    game: {
      name: "Hollow Knight",
      image: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5nng.jpg",
    },
    saveName: "Save 3",
    createdAt: "March 15, 2024 - 14:30",
    size: "1.2 GB",
    syncStatus: "synced",
    description: "Boss fight completed - Before entering City of Tears",
  },
  {
    id: "2",
    game: {
      name: "Gears Tactics",
      image: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1tmu.jpg",
    },
    saveName: "Save 2",
    createdAt: "March 14, 2024 - 20:15",
    size: "800 MB",
    syncStatus: "syncing",
    description: "Chapter 2 - Mission 3 completed",
  },
  {
    id: "3",
    game: {
      name: "Balatro",
      image: "https://images.igdb.com/igdb/image/upload/t_cover_big/co4d5v.jpg",
    },
    saveName: "Save 1",
    createdAt: "March 13, 2024 - 15:45",
    size: "200 MB",
    syncStatus: "not_synced",
    description: "First run completed with Joker deck",
  },
];

const BackupCard: React.FC<{ backup: BackupItem }> = ({ backup }) => {
  const getSyncStatusColor = (status: BackupItem["syncStatus"]) => {
    switch (status) {
      case "synced":
        return "text-green-500";
      case "syncing":
        return "text-yellow-500";
      case "not_synced":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getSyncStatusText = (status: BackupItem["syncStatus"]) => {
    switch (status) {
      case "synced":
        return "Cloud Synced";
      case "syncing":
        return "Syncing...";
      case "not_synced":
        return "Not Synced";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="bg-game-card rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            src={backup.game.image}
            alt={backup.game.name}
            className="w-16 h-20 rounded-lg object-cover"
          />
          <div>
            <h3 className="text-xl font-bold">
              {backup.game.name} - {backup.saveName}
            </h3>
            <p className="text-gray-400">Created: {backup.createdAt}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm text-gray-400">Size: {backup.size}</span>
              <span className="text-sm text-gray-400">•</span>
              <span
                className={`text-sm ${getSyncStatusColor(backup.syncStatus)}`}
              >
                {getSyncStatusText(backup.syncStatus)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors">
            Restore
          </button>
          <button className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="mt-4 text-gray-400">{backup.description}</div>
    </div>
  );
};

export default function History() {
  const [selectedGame, setSelectedGame] = useState("all");
  const [selectedTime, setSelectedTime] = useState("all");

  const gameOptions = [
    { value: "all", label: "All Games" },
    { value: "hollow_knight", label: "Hollow Knight" },
    { value: "gears_tactics", label: "Gears Tactics" },
    { value: "balatro", label: "Balatro" },
  ];

  const timeOptions = [
    { value: "all", label: "All Time" },
    { value: "24h", label: "Last 24 Hours" },
    { value: "week", label: "Last Week" },
    { value: "month", label: "Last Month" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Filters and Search */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search backups..."
              className="bg-white/10 rounded-lg pl-10 pr-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-rog-blue"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
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
          </div>
          <DropdownSelect
            options={gameOptions}
            value={selectedGame}
            onChange={setSelectedGame}
            placeholder="Select Game"
            className="w-48"
          />
          <DropdownSelect
            options={timeOptions}
            value={selectedTime}
            onChange={setSelectedTime}
            placeholder="Select Time Range"
            className="w-48"
          />
        </div>
        <div className="flex items-center space-x-4">
          <button className="bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center space-x-2">
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
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Export</span>
          </button>
          <button className="bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center space-x-2">
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
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Backup List */}
      <div className="space-y-4">
        {mockBackups.map((backup) => (
          <BackupCard key={backup.id} backup={backup} />
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-8 flex items-center justify-between">
        <div className="text-gray-400">Showing 1-3 of 36 backups</div>
        <div className="flex items-center space-x-2">
          <button className="bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
            Previous
          </button>
          <button className="bg-rog-blue px-4 py-2 rounded-lg">1</button>
          <button className="bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
            2
          </button>
          <button className="bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
            3
          </button>
          <span className="px-2">...</span>
          <button className="bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
            12
          </button>
          <button className="bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
