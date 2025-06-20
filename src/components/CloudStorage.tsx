import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import DropdownSelect from "./DropdownSelect";
import { Cloud } from "lucide-react";
import "../i18n/config";

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
      <h2 className="text-xl font-bold mb-6">{t("cloudStorage.title")}</h2>
      <div className="space-y-6">
        {/* Google Drive */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Cloud className="w-6 h-6 text-[#4285F4]" />
            <div>
              <p className="font-medium">Google Drive</p>
              <p className="text-sm text-gray-400">
                {t("cloudStorage.connectedAs", { email: "john@gmail.com" })}
              </p>
            </div>
          </div>
          <button className="text-red-500 hover:text-red-400 text-sm">
            {t("cloudStorage.actions.disconnect")}
          </button>
        </div>

        {/* Dropbox */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Cloud className="w-6 h-6 text-[#0061FF]" />
            <div>
              <p className="font-medium">Dropbox</p>
              <p className="text-sm text-gray-400">
                {t("cloudStorage.status.notConnected")}
              </p>
            </div>
          </div>
          <button className="text-rog-blue hover:text-blue-400 text-sm">
            {t("cloudStorage.actions.connect")}
          </button>
        </div>

        {/* OneDrive */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Cloud className="w-6 h-6 text-[#0078D4]" />
            <div>
              <p className="font-medium">OneDrive</p>
              <p className="text-sm text-gray-400">
                {t("cloudStorage.status.notConnected")}
              </p>
            </div>
          </div>
          <button className="text-rog-blue hover:text-blue-400 text-sm">
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
              <span className="text-gray-400">
                {t("cloudStorage.autoSync.frequency")}
              </span>
              <DropdownSelect
                options={syncFrequencyOptions}
                value={syncFrequency}
                onChange={setSyncFrequency}
                className="w-48"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">
                {t("cloudStorage.autoSync.keepLocal")}
              </span>
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
