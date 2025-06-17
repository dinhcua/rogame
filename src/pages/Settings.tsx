import React, { useState } from "react";
import DropdownSelect from "../components/DropdownSelect";

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
                    <svg
                      className="w-6 h-6 text-rog-blue"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
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
            icon={
              <svg className="w-6 h-6 text-[#4285F4]" viewBox="0 0 87.3 78">
                <path
                  d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
                  fill="#0066da"
                />
                <path
                  d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z"
                  fill="#00ac47"
                />
                <path
                  d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
                  fill="#ea4335"
                />
                <path
                  d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
                  fill="#00832d"
                />
                <path
                  d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
                  fill="#2684fc"
                />
                <path
                  d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"
                  fill="#ffba00"
                />
              </svg>
            }
            email="john@gmail.com"
            connected={true}
          />

          <CloudProvider
            name="Dropbox"
            icon={
              <svg
                className="w-6 h-6 text-[#0061FF]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0L6 4.8l6 4.8-6 4.8 6 4.8 6-4.8-6-4.8 6-4.8L12 0zM6 14.4L0 9.6l6-4.8L0 0v19.2L6 24V14.4zm12 0l6-4.8-6-4.8 6-4.8v19.2L18 24V14.4z" />
              </svg>
            }
          />

          <CloudProvider
            name="OneDrive"
            icon={
              <svg
                className="w-6 h-6 text-[#0078D4]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M21.69 11.1c-.13-.3-.29-.57-.47-.84.01-.04.01-.08.01-.12 0-1.76-1.42-3.19-3.19-3.19-.31 0-.61.05-.9.13-.44-2.5-2.6-4.4-5.24-4.4-2.93 0-5.3 2.37-5.3 5.3 0 .48.07.94.19 1.38-.06 0-.12-.01-.18-.01-2.07 0-3.75 1.68-3.75 3.75 0 2.07 1.68 3.75 3.75 3.75h11.05c2.84 0 5.15-2.31 5.15-5.15 0-.2-.01-.4-.04-.6z" />
              </svg>
            }
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
