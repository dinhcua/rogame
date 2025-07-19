import React from "react";
import { useTranslation } from "react-i18next";
import "../i18n/config";

const StorageInfo: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-game-card rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">{t("storageInfo.title")}</h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">{t("storageInfo.usedSpace")}</span>
          <span className="font-medium">1.2 GB</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">
            {t("storageInfo.availableSpace")}
          </span>
          <span className="font-medium">8.8 GB</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: "12%" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default StorageInfo;
