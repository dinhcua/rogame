import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import DropdownSelect from "./DropdownSelect";
import "../i18n/config";
import PlatformIcon from "./PlatformIcon";

// Import platform icons
// import googleDriveIcon from "../assets/platforms/google_drive.svg";
// import dropboxIcon from "../assets/platforms/dropbox.svg";
// import onedriveIcon from "../assets/platforms/onedrive.svg";

const CloudStorage: React.FC = () => {
  const { t } = useTranslation();
  const [syncFrequency, setSyncFrequency] = useState("every_save");

  const syncFrequencyOptions = [
    { value: "every_save", label: t("cloudStorage.frequency.everySave") },
    { value: "hourly", label: t("cloudStorage.frequency.hourly") },
    { value: "daily", label: t("cloudStorage.frequency.daily") },
    { value: "manual", label: t("cloudStorage.frequency.manual") },
  ];

  return (
    <div className="bg-game-card rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">{t("cloudStorage.title")}</h2>
        <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded">
          Coming Soon
        </span>
      </div>

      <div className="space-y-6 opacity-50">
        {/* Google Drive */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <PlatformIcon platform="google_drive" />
            <div>
              <p className="font-medium">Google Drive</p>
              <p className="text-sm text-gray-400">
                {t("cloudStorage.status.notConnected")}
              </p>
            </div>
          </div>
          <button
            disabled
            className="text-rog-blue hover:text-blue-400 text-sm cursor-not-allowed"
          >
            {t("cloudStorage.actions.connect")}
          </button>
        </div>

        {/* Dropbox */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* <img src={dropboxIcon} alt="Dropbox" className="w-6 h-6" /> */}
            <PlatformIcon platform="dropbox" />
            <div>
              <p className="font-medium">Dropbox</p>
              <p className="text-sm text-gray-400">
                {t("cloudStorage.status.notConnected")}
              </p>
            </div>
          </div>
          <button
            disabled
            className="text-rog-blue hover:text-blue-400 text-sm cursor-not-allowed"
          >
            {t("cloudStorage.actions.connect")}
          </button>
        </div>

        {/* OneDrive */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* <img src={onedriveIcon} alt="OneDrive" className="w-6 h-6" /> */}
            <PlatformIcon platform="onedrive" />
            <div>
              <p className="font-medium">OneDrive</p>
              <p className="text-sm text-gray-400">
                {t("cloudStorage.status.notConnected")}
              </p>
            </div>
          </div>
          <button
            disabled
            className="text-rog-blue hover:text-blue-400 text-sm cursor-not-allowed"
          >
            {t("cloudStorage.actions.connect")}
          </button>
        </div>

        {/* Auto-sync Settings */}
        <div className="border-t border-white/10 pt-4 mt-4">
          <h3 className="text-lg font-medium mb-4">
            {t("cloudStorage.autoSync.title")}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">
                {t("cloudStorage.autoSync.enabled")}
              </span>
              <label className="relative inline-flex items-center cursor-not-allowed">
                <input
                  type="checkbox"
                  value=""
                  className="sr-only peer"
                  disabled
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer dark:bg-gray-700 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">
                {t("cloudStorage.autoSync.frequency")}
              </span>
              <DropdownSelect
                options={syncFrequencyOptions}
                value={syncFrequency}
                onChange={setSyncFrequency}
                className="w-48"
                disabled
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">
                {t("cloudStorage.autoSync.keepLocal")}
              </span>
              <label className="relative inline-flex items-center cursor-not-allowed">
                <input
                  type="checkbox"
                  value=""
                  className="sr-only peer"
                  disabled
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer dark:bg-gray-700 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudStorage;
