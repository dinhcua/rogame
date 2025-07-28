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
  const [gameTitle, setGameTitle] = useState("");
  const [steamId, setSteamId] = useState("");
  const [savePath, setSavePath] = useState("");
  const [savePattern, setSavePattern] = useState("");

  const platformOptions = [
    { value: "Steam", label: "Steam" },
    { value: "Epic Games", label: t("addGameModal.platforms.epic") },
    { value: "GOG", label: "GOG" },
    { value: "Origin", label: "Origin" },
    { value: "Other", label: t("addGameModal.platforms.other") },
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
                value={gameTitle}
                onChange={(e) => setGameTitle(e.target.value)}
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
                  value={steamId}
                  onChange={(e) => setSteamId(e.target.value)}
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
                value={savePath}
                onChange={(e) => setSavePath(e.target.value)}
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
              value={savePattern}
              onChange={(e) => setSavePattern(e.target.value)}
              className="w-full bg-black/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rog-blue"
              placeholder={t("addGameModal.savePattern.placeholder")}
            />
            <p className="text-sm text-gray-400 mt-2">
              {t("addGameModal.savePattern.hint")}
            </p>
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
              // Validate required fields
              if (!gameTitle || !selectedPlatform || !savePath) {
                return;
              }
              
              // Use Steam CDN for cover image if Steam ID is provided
              const coverImage = steamId 
                ? `https://steamcdn-a.akamaihd.net/steam/apps/${steamId}/library_600x900_2x.jpg`
                : `https://via.placeholder.com/300x400?text=${encodeURIComponent(gameTitle)}`;
              
              const gameData = {
                title: gameTitle,
                platform: selectedPlatform,
                steam_id: steamId || "0", // Default to "0" if not provided
                save_path: savePath,
                save_pattern: savePattern || "*.sav", // Default pattern
                cover_image: coverImage,
              };
              
              onAdd(gameData);
              onClose();
              
              // Reset form
              setGameTitle("");
              setSelectedPlatform("");
              setSteamId("");
              setSavePath("");
              setSavePattern("");
            }}
            disabled={!gameTitle || !selectedPlatform || !savePath}
            className="bg-rog-blue px-6 py-2.5 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("addGameModal.actions.add")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddGameModal;
