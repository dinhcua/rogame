import React from "react";
import { useTranslation } from "react-i18next";
import DropdownSelect from "./DropdownSelect";
import "../i18n/config";
import PlatformIcon from "./PlatformIcon";
import { useCloudStorage } from "../hooks/useCloudStorage";
import { CloudProvider } from "../types/cloud";
import { Loader2 } from "lucide-react";

const CloudStorage: React.FC = () => {
  const { t } = useTranslation();
  const {
    isLoading,
    tokensLoaded,
    authenticate,
    disconnectProvider,
    isProviderConnected,
    getProviderName,
    refreshTokens,
  } = useCloudStorage();

  // Refresh tokens when component mounts
  React.useEffect(() => {
    refreshTokens();
  }, [refreshTokens]);

  // Temporary sync settings state (should be managed in a proper store)
  const [syncSettings, setSyncSettings] = React.useState({
    enabled: false,
    frequency: "daily",
    keep_local_copy: true,
  });

  const syncFrequencyOptions = [
    { value: "every_save", label: t("cloudStorage.frequency.everySave") },
    { value: "hourly", label: t("cloudStorage.frequency.hourly") },
    { value: "daily", label: t("cloudStorage.frequency.daily") },
    { value: "manual", label: t("cloudStorage.frequency.manual") },
  ];

  const providers: CloudProvider[] = ['google_drive', 'dropbox', 'onedrive'];

  // Debug logging
  React.useEffect(() => {
    providers.forEach(provider => {
      console.log(`Provider ${provider} connected:`, isProviderConnected(provider));
    });
  }, [isProviderConnected, providers]);

  return (
    <div className="bg-game-card rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{t("cloudStorage.title")}</h2>
      </div>

      <div className="space-y-4">
        {!tokensLoaded ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-400">Loading cloud providers...</span>
          </div>
        ) : (
          providers.map((provider) => {
            const isConnected = isProviderConnected(provider);
            
            return (
            <div key={provider} className="flex items-center justify-between p-3 rounded-lg bg-epic-hover hover:bg-epic-hover/80 transition-all duration-200">
              <div className="flex items-center space-x-3">
                <PlatformIcon platform={provider} />
                <div>
                  <p className="font-medium">{getProviderName(provider)}</p>
                  <p className="text-sm text-gray-400">
                    {isConnected
                      ? t("cloudStorage.status.connected")
                      : t("cloudStorage.status.notConnected")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (isConnected) {
                    disconnectProvider(provider);
                  } else {
                    authenticate(provider);
                  }
                }}
                disabled={isLoading}
                className="text-rog-blue hover:text-epic-accent text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-rog-blue/10"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {isConnected
                    ? t("cloudStorage.actions.disconnect")
                    : t("cloudStorage.actions.connect")}
                </span>
              </button>
            </div>
            );
          })
        )}

        {/* Auto-sync Settings */}
        <div className="border-t border-gray-700 pt-4 mt-4">
          <h3 className="text-base font-semibold mb-3">
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
                  checked={syncSettings.enabled}
                  onChange={(e) => {
                    setSyncSettings({
                      ...syncSettings,
                      enabled: e.target.checked,
                    });
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-epic-hover rounded-full peer peer-checked:bg-rog-blue after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">
                {t("cloudStorage.autoSync.frequency")}
              </span>
              <DropdownSelect
                options={syncFrequencyOptions}
                value={syncSettings.frequency}
                onChange={(value) => {
                  setSyncSettings({
                    ...syncSettings,
                    frequency: value as any,
                  });
                }}
                className="w-48"
                disabled={!syncSettings.enabled}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">
                {t("cloudStorage.autoSync.keepLocal")}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncSettings.keep_local_copy}
                  onChange={(e) => {
                    setSyncSettings({
                      ...syncSettings,
                      keep_local_copy: e.target.checked,
                    });
                  }}
                  className="sr-only peer"
                  disabled={!syncSettings.enabled}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-rog-blue dark:bg-gray-700 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:after:translate-x-full peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudStorage;