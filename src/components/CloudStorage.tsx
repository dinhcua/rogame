import React, { useState } from "react";
import DropdownSelect from "./DropdownSelect";

const CloudStorage: React.FC = () => {
  const [syncFrequency, setSyncFrequency] = useState("every_save");

  const syncFrequencyOptions = [
    { value: "every_save", label: "Every save" },
    { value: "hourly", label: "Every hour" },
    { value: "daily", label: "Every day" },
    { value: "manual", label: "Manual only" },
  ];

  return (
    <div className="bg-game-card rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">Cloud Storage</h2>
      <div className="space-y-6">
        {/* Google Drive */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
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
            <div>
              <p className="font-medium">Google Drive</p>
              <p className="text-sm text-gray-400">
                Connected as john@gmail.com
              </p>
            </div>
          </div>
          <button className="text-red-500 hover:text-red-400 text-sm">
            Disconnect
          </button>
        </div>

        {/* Dropbox */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg
              className="w-6 h-6 text-[#0061FF]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L6 4.8l6 4.8-6 4.8 6 4.8 6-4.8-6-4.8 6-4.8L12 0zM6 14.4L0 9.6l6-4.8L0 0v19.2L6 24V14.4zm12 0l6-4.8-6-4.8 6-4.8v19.2L18 24V14.4z" />
            </svg>
            <div>
              <p className="font-medium">Dropbox</p>
              <p className="text-sm text-gray-400">Not connected</p>
            </div>
          </div>
          <button className="text-rog-blue hover:text-blue-400 text-sm">
            Connect
          </button>
        </div>

        {/* OneDrive */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg
              className="w-6 h-6 text-[#0078D4]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M21.69 11.1c-.13-.3-.29-.57-.47-.84.01-.04.01-.08.01-.12 0-1.76-1.42-3.19-3.19-3.19-.31 0-.61.05-.9.13-.44-2.5-2.6-4.4-5.24-4.4-2.93 0-5.3 2.37-5.3 5.3 0 .48.07.94.19 1.38-.06 0-.12-.01-.18-.01-2.07 0-3.75 1.68-3.75 3.75 0 2.07 1.68 3.75 3.75 3.75h11.05c2.84 0 5.15-2.31 5.15-5.15 0-.2-.01-.4-.04-.6z" />
            </svg>
            <div>
              <p className="font-medium">OneDrive</p>
              <p className="text-sm text-gray-400">Not connected</p>
            </div>
          </div>
          <button className="text-rog-blue hover:text-blue-400 text-sm">
            Connect
          </button>
        </div>

        {/* Auto-sync Settings */}
        <div className="border-t border-white/10 pt-4 mt-4">
          <h3 className="text-lg font-medium mb-4">Auto-sync Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Auto-sync enabled</span>
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
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Sync frequency</span>
              <DropdownSelect
                options={syncFrequencyOptions}
                value={syncFrequency}
                onChange={setSyncFrequency}
                className="w-48"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Keep local copy</span>
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
      </div>
    </div>
  );
};

export default CloudStorage;
