import React, { useState } from "react";
import DropdownSelect from "./DropdownSelect";

const BackupSettings: React.FC = () => {
  const [backupInterval, setBackupInterval] = useState("30min");
  const [maxBackups, setMaxBackups] = useState("5");

  const intervalOptions = [
    { value: "15min", label: "15 minutes" },
    { value: "30min", label: "30 minutes" },
    { value: "1hour", label: "1 hour" },
  ];

  const maxBackupsOptions = [
    { value: "3", label: "3 saves" },
    { value: "5", label: "5 saves" },
    { value: "10", label: "10 saves" },
  ];

  return (
    <div className="bg-game-card rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">Backup Settings</h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Auto-Backup</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              value=""
              className="sr-only peer"
              defaultChecked
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Backup Interval</span>
          <DropdownSelect
            options={intervalOptions}
            value={backupInterval}
            onChange={setBackupInterval}
            className="w-36"
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Max Backups</span>
          <DropdownSelect
            options={maxBackupsOptions}
            value={maxBackups}
            onChange={setMaxBackups}
            className="w-36"
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Compression</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              value=""
              className="sr-only peer"
              defaultChecked
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default BackupSettings;
