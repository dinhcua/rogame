import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import DropdownSelect from "./DropdownSelect";
import "../i18n/config";

interface BackupSettings {
  auto_backup: boolean;
  backup_interval: string;
  max_backups: number;
  compression_enabled: boolean;
}

const BackupSettings: React.FC = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<BackupSettings>({
    auto_backup: true,
    backup_interval: "30min",
    max_backups: 5,
    compression_enabled: true,
  });

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

  useEffect(() => {
    // Load settings when component mounts
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await invoke<BackupSettings>(
        "load_backup_settings"
      );
      setSettings(savedSettings);
    } catch (error) {
      console.error("Failed to load backup settings:", error);
    }
  };

  const saveSettings = async (newSettings: BackupSettings) => {
    try {
      await invoke("save_backup_settings", { settings: newSettings });
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to save backup settings:", error);
    }
  };

  const handleAutoBackupChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newSettings = { ...settings, auto_backup: event.target.checked };
    saveSettings(newSettings);
  };

  const handleIntervalChange = (value: string) => {
    const newSettings = { ...settings, backup_interval: value };
    saveSettings(newSettings);
  };

  const handleMaxBackupsChange = (value: string) => {
    const newSettings = { ...settings, max_backups: parseInt(value) };
    saveSettings(newSettings);
  };

  const handleCompressionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newSettings = {
      ...settings,
      compression_enabled: event.target.checked,
    };
    saveSettings(newSettings);
  };

  return (
    <div className="bg-game-card rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{t("backupSettings.title")}</h2>
        <span className="text-xs px-3 py-1.5 bg-epic-warning/10 text-epic-warning rounded-lg font-medium">
          {t("backupSettings.comingSoon")}
        </span>
      </div>
      <div className="space-y-4 opacity-50">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">
            {t("backupSettings.autoBackup")}
          </span>
          <label className="relative inline-flex items-center cursor-not-allowed">
            <input
              type="checkbox"
              checked={settings.auto_backup}
              onChange={handleAutoBackupChange}
              className="sr-only peer"
              disabled
            />
            <div className="w-11 h-6 bg-epic-hover rounded-full peer peer-checked:bg-rog-blue peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
          </label>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">{t("backupSettings.interval")}</span>
          <DropdownSelect
            options={intervalOptions}
            value={settings.backup_interval}
            onChange={handleIntervalChange}
            className="w-36"
            disabled
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">
            {t("backupSettings.maxBackups")}
          </span>
          <DropdownSelect
            options={maxBackupsOptions}
            value={settings.max_backups.toString()}
            onChange={handleMaxBackupsChange}
            className="w-36"
            disabled
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">
            {t("backupSettings.compression")}
          </span>
          <label className="relative inline-flex items-center cursor-not-allowed">
            <input
              type="checkbox"
              checked={settings.compression_enabled}
              onChange={handleCompressionChange}
              className="sr-only peer"
              disabled
            />
            <div className="w-11 h-6 bg-epic-hover rounded-full peer peer-checked:bg-rog-blue peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default BackupSettings;
