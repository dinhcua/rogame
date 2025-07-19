import { useState } from "react";
import { useTranslation } from "react-i18next";
import DropdownSelect from "./DropdownSelect";
import { X, Folder } from "lucide-react";
import "../i18n/config";

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (gameData: any) => void;
}

const AddGameModal = ({ isOpen, onClose, onAdd }: AddGameModalProps) => {
  const { t } = useTranslation();
  const [selectedPlatform, setSelectedPlatform] = useState("");

  const platformOptions = [
    { value: "steam", label: "Steam" },
    { value: "epic", label: t("addGameModal.platforms.epic") },
    { value: "gog", label: "GOG" },
    { value: "origin", label: "Origin" },
    { value: "other", label: t("addGameModal.platforms.other") },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-game-card rounded-lg w-full max-w-2xl mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-xl font-medium">{t("addGameModal.title")}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Game Info Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("addGameModal.gameInfo.title")}
              </label>
              <input
                type="text"
                className="w-full bg-black/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rog-blue"
                placeholder={t("addGameModal.gameInfo.titlePlaceholder")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("addGameModal.gameInfo.platform")}
                </label>
                <DropdownSelect
                  options={platformOptions}
                  value={selectedPlatform}
                  onChange={setSelectedPlatform}
                  placeholder={t("addGameModal.gameInfo.platformPlaceholder")}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("addGameModal.gameInfo.version")}
                </label>
                <input
                  type="text"
                  className="w-full bg-black/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rog-blue"
                  placeholder={t("addGameModal.gameInfo.versionPlaceholder")}
                />
              </div>
            </div>
          </div>

          {/* Save Location Section */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("addGameModal.saveLocation.title")}
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-1 bg-black/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rog-blue"
                placeholder={t("addGameModal.saveLocation.pathPlaceholder")}
              />
              <button className="bg-white/10 px-4 rounded-lg hover:bg-white/20 transition-colors flex items-center space-x-2">
                <Folder className="w-5 h-5" />
                <span>{t("addGameModal.saveLocation.browse")}</span>
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              {t("addGameModal.saveLocation.commonLocations")}
            </p>
          </div>

          {/* Save Pattern Section */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("addGameModal.savePattern.title")}
            </label>
            <input
              type="text"
              className="w-full bg-black/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rog-blue"
              placeholder={t("addGameModal.savePattern.placeholder")}
            />
            <p className="text-sm text-gray-400 mt-2">
              {t("addGameModal.savePattern.hint")}
            </p>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="w-5 h-5 rounded bg-black/20 border-white/20 text-rog-blue focus:ring-rog-blue focus:ring-offset-0"
              />
              <span className="text-sm">
                {t("addGameModal.options.monitorChanges")}
              </span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="w-5 h-5 rounded bg-black/20 border-white/20 text-rog-blue focus:ring-rog-blue focus:ring-offset-0"
              />
              <span className="text-sm">
                {t("addGameModal.options.autoBackup")}
              </span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="w-5 h-5 rounded bg-black/20 border-white/20 text-rog-blue focus:ring-rog-blue focus:ring-offset-0"
              />
              <span className="text-sm">
                {t("addGameModal.options.cloudSync")}
              </span>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={() => {
              // TODO: Implement form data collection and validation
              onAdd({});
              onClose();
            }}
            className="bg-rog-blue px-6 py-2.5 rounded-lg hover:bg-blue-500 transition-colors"
          >
            {t("addGameModal.actions.add")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddGameModal;
