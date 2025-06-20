import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import DropdownSelect from "./DropdownSelect";
import "../i18n/config";

const BackupSettings: React.FC = () => {
  const { t } = useTranslation();
  const [backupInterval, setBackupInterval] = useState("30min");
  const [maxBackups, setMaxBackups] = useState("5");

  const intervalOptions = [
    { value: "15min", label: t("backupSettings.intervals.15min") },
    { value: "30min", label: t("backupSettings.intervals.30min") },
    { value: "1hour", label: t("backupSettings.intervals.1hour") },
  ];

  const maxBackupsOptions = [
    { value: "3", label: t("backupSettings.maxBackups_options.3saves") },
    { value: "5", label: t("backupSettings.maxBackups_options.5saves") },
    { value: "10", label: t("backupSettings.maxBackups_options.10saves") },
  ];

  return (
    <div className="bg-game-card rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">{t("backupSettings.title")}</h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">
            {t("backupSettings.autoBackup")}
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
        <div className="flex justify-between items-center">
          <span className="text-gray-400">{t("backupSettings.interval")}</span>
          <DropdownSelect
            options={intervalOptions}
            value={backupInterval}
            onChange={setBackupInterval}
            className="w-36"
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">
            {t("backupSettings.maxBackups")}
          </span>
          <DropdownSelect
            options={maxBackupsOptions}
            value={maxBackups}
            onChange={setMaxBackups}
            className="w-36"
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">
            {t("backupSettings.compression")}
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
  );
};

export default BackupSettings;
