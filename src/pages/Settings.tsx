import React, { useState } from "react";
import DropdownSelect from "../components/DropdownSelect";
import { Clock, Cloud } from "lucide-react";

interface ToggleProps {
  label: string;
  description?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({
  label,
  description,
  checked = false,
  onChange,
}) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="font-medium">{label}</p>
      {description && <p className="text-sm text-gray-400">{description}</p>}
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
    </label>
  </div>
);

interface CloudProviderProps {
  name: string;
  icon: React.ReactNode;
  email?: string;
  connected?: boolean;
}

const CloudProvider: React.FC<CloudProviderProps> = ({
  name,
  icon,
  email,
  connected,
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <div className="w-6 h-6">{icon}</div>
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-gray-400">
          {connected ? `Connected as ${email}` : "Not connected"}
        </p>
      </div>
    </div>
    <button
      className={
        connected
          ? "text-red-500 hover:text-red-400"
          : "text-rog-blue hover:text-blue-400"
      }
    >
      {connected ? "Disconnect" : "Connect"}
    </button>
  </div>
);

export default function Settings() {
  const [compression, setCompression] = useState("medium");
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [syncFrequency, setSyncFrequency] = useState("hourly");

  const compressionOptions = [
    { value: "none", label: "None" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  const backupFrequencyOptions = [
    { value: "every_save", label: "Every save" },
    { value: "hourly", label: "Every hour" },
    { value: "daily", label: "Every day" },
    { value: "weekly", label: "Every week" },
    { value: "custom", label: "Custom" },
  ];

  const syncFrequencyOptions = [
    { value: "every_save", label: "Every save" },
    { value: "hourly", label: "Every hour" },
    { value: "daily", label: "Every day" },
    { value: "manual", label: "Manual only" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* General Settings */}
      <div className="bg-game-card rounded-lg p-6">
        <h2 className="text-xl font-bold mb-6">General Settings</h2>
        <div className="space-y-6">
          <Toggle
            label="Dark Mode"
            description="Enable dark mode for the application"
            checked={true}
          />
          <Toggle
            label="Desktop Notifications"
            description="Show notifications for backup events"
            checked={true}
          />
          <Toggle
            label="Start on System Startup"
            description="Launch application when system starts"
          />
        </div>
      </div>

      {/* Backup Settings */}
      <div className="bg-game-card rounded-lg p-6">
        <h2 className="text-xl font-bold mb-6">Backup Settings</h2>
        <div className="space-y-6">
          {/* Default Location */}
          <div>
            <label className="block text-gray-400 mb-2">
              Default Backup Location
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-1 bg-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rog-blue"
                value="C:/GameSaveManager/Backups"
              />
              <button className="bg-white/10 px-4 rounded-lg hover:bg-white/20">
                Browse
              </button>
            </div>
          </div>

          {/* Compression Settings */}
          <div>
            <label className="block text-gray-400 mb-2">
              Default Compression Level
            </label>
            <DropdownSelect
              options={compressionOptions}
              value={compression}
              onChange={setCompression}
              className="w-full"
            />
          </div>

          {/* Backup Schedule */}
          <div>
            <label className="block text-gray-400 mb-2">Backup Schedule</label>
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-rog-blue" />
                  </div>
                  <div>
                    <h3 className="font-medium">Automatic Backups</h3>
                    <p className="text-sm text-gray-400">
                      Create backups on a schedule
                    </p>
                  </div>
                </div>
                <Toggle checked={true} label="" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2">Frequency</label>
                  <DropdownSelect
                    options={backupFrequencyOptions}
                    value={backupFrequency}
                    onChange={setBackupFrequency}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">
                    Time of Day
                  </label>
                  <input
                    type="time"
                    className="w-full bg-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rog-blue"
                    value="03:00"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Integration */}
      <div className="bg-game-card rounded-lg p-6">
        <h2 className="text-xl font-bold mb-6">Cloud Integration</h2>
        <div className="space-y-6">
          <CloudProvider
            name="Google Drive"
            icon={<Cloud className="w-6 h-6 text-[#4285F4]" />}
            email="john@gmail.com"
            connected={true}
          />

          <CloudProvider
            name="Dropbox"
            icon={<Cloud className="w-6 h-6 text-[#0061FF]" />}
            connected={false}
          />

          <CloudProvider
            name="OneDrive"
            icon={<Cloud className="w-6 h-6 text-[#0078D4]" />}
            connected={false}
          />

          <div className="border-t border-white/10 pt-4 mt-4">
            <h3 className="text-lg font-medium mb-4">Auto-sync Settings</h3>
            <div className="space-y-4">
              <Toggle label="Auto-sync enabled" checked={true} />
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Sync frequency</span>
                <DropdownSelect
                  options={syncFrequencyOptions}
                  value={syncFrequency}
                  onChange={setSyncFrequency}
                  className="w-48"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-500 mb-6">Danger Zone</h2>
        <div className="space-y-6">
          <div>
            <p className="font-medium text-red-400">Clear All Data</p>
            <p className="text-sm text-gray-400 mb-4">
              Remove all saved games and settings
            </p>
            <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
              Clear Data
            </button>
          </div>
          <div className="border-t border-red-500/20 pt-6">
            <p className="font-medium text-red-400">Reset to Default</p>
            <p className="text-sm text-gray-400 mb-4">
              Reset all settings to default values
            </p>
            <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
              Reset Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
