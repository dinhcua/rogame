import { useState } from "react";
import { useTranslation } from "react-i18next";
import DropdownSelect from "./DropdownSelect";
import { X, Folder } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import "../i18n/config";

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (gameData: any) => void;
}

interface FormData {
  title: string;
  platform: string;
  locations: string[];
  patterns: string[];
  cover_image: string;
  category: string;
  save_location: string;
}

const AddGameModal = ({ isOpen, onClose, onAdd }: AddGameModalProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    title: "",
    platform: "",
    locations: [""],
    patterns: ["*.sav"],
    cover_image:
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg", // Default cover
    category: "",
    save_location: "", // Initialize save_location
  });
  const [error, setError] = useState<string>("");

  const platformOptions = [
    { value: "Steam", label: "Steam" },
    { value: "Epic Games", label: t("addGameModal.platforms.epic") },
    { value: "GOG", label: "GOG" },
    { value: "Origin", label: "Origin" },
    { value: "other", label: t("addGameModal.platforms.other") },
  ];

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleLocationChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newLocations = [...prev.locations];
      newLocations[index] = value;
      return { ...prev, locations: newLocations };
    });
  };

  const handlePatternChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newPatterns = [...prev.patterns];
      newPatterns[index] = value;
      return { ...prev, patterns: newPatterns };
    });
  };

  const addLocation = () => {
    setFormData((prev) => ({
      ...prev,
      locations: [...prev.locations, ""],
    }));
  };

  const addPattern = () => {
    setFormData((prev) => ({
      ...prev,
      patterns: [...prev.patterns, ""],
    }));
  };

  const removeLocation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index),
    }));
  };

  const removePattern = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      patterns: prev.patterns.filter((_, i) => i !== index),
    }));
  };

  const handleBrowse = async (index: number) => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected) {
        handleLocationChange(index, selected as string);
      }
    } catch (err) {
      console.error("Failed to open directory:", err);
    }
  };

  const handleSubmit = async () => {
    try {
      // Reset any previous error
      setError("");

      // Validate form
      if (!formData.title.trim()) {
        setError(t("addGameModal.errors.titleRequired"));
        return;
      }
      if (!formData.platform) {
        setError(t("addGameModal.errors.platformRequired"));
        return;
      }
      if (!formData.locations[0]) {
        setError(t("addGameModal.errors.locationRequired"));
        return;
      }
      if (!formData.patterns[0]) {
        setError(t("addGameModal.errors.patternRequired"));
        return;
      }

      // Filter out empty locations and patterns
      const cleanedFormData = {
        ...formData,
        locations: formData.locations.filter((loc) => loc.trim() !== ""),
        patterns: formData.patterns.filter((pat) => pat.trim() !== ""),
        save_location: formData.locations[0], // Use the first location as save_location
      };

      // Call Rust function to add custom game
      const gameInfo = await invoke<any>("import_custom_game", {
        gameInfo: cleanedFormData,
      });

      if (gameInfo) {
        onAdd(gameInfo);
        onClose();
      }
    } catch (err) {
      console.error("Error adding game:", err);
      setError(
        typeof err === "string" ? err : "Failed to add game. Please try again."
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-game-card rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
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
          {error && (
            <div className="bg-red-500/20 text-red-500 p-4 rounded-lg">
              {error}
            </div>
          )}

          {/* Game Info Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("addGameModal.gameInfo.title")}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
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
                  value={formData.platform}
                  onChange={(value) => handleInputChange("platform", value)}
                  placeholder={t("addGameModal.gameInfo.platformPlaceholder")}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("addGameModal.gameInfo.category")}
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
                  className="w-full bg-black/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rog-blue"
                  placeholder={t("addGameModal.gameInfo.categoryPlaceholder")}
                />
              </div>
            </div>
          </div>

          {/* Save Locations Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">
                {t("addGameModal.saveLocation.title")}
              </label>
              <button
                onClick={addLocation}
                className="text-sm text-rog-blue hover:text-blue-400"
              >
                {t("addGameModal.saveLocation.addAnother")}
              </button>
            </div>
            <div className="space-y-3">
              {formData.locations.map((location, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) =>
                      handleLocationChange(index, e.target.value)
                    }
                    className="flex-1 bg-black/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rog-blue"
                    placeholder={t("addGameModal.saveLocation.pathPlaceholder")}
                  />
                  <button
                    onClick={() => handleBrowse(index)}
                    className="bg-white/10 px-4 rounded-lg hover:bg-white/20 transition-colors flex items-center space-x-2"
                  >
                    <Folder className="w-5 h-5" />
                    <span>{t("addGameModal.saveLocation.browse")}</span>
                  </button>
                  {index > 0 && (
                    <button
                      onClick={() => removeLocation(index)}
                      className="text-red-500 hover:text-red-400 px-2"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-2">
              {t("addGameModal.saveLocation.commonLocations")}
            </p>
          </div>

          {/* Save Pattern Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">
                {t("addGameModal.savePattern.title")}
              </label>
              <button
                onClick={addPattern}
                className="text-sm text-rog-blue hover:text-blue-400"
              >
                {t("addGameModal.savePattern.addAnother")}
              </button>
            </div>
            <div className="space-y-3">
              {formData.patterns.map((pattern, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    value={pattern}
                    onChange={(e) => handlePatternChange(index, e.target.value)}
                    className="flex-1 bg-black/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rog-blue"
                    placeholder={t("addGameModal.savePattern.placeholder")}
                  />
                  {index > 0 && (
                    <button
                      onClick={() => removePattern(index)}
                      className="text-red-500 hover:text-red-400 px-2"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-2">
              {t("addGameModal.savePattern.hint")}
            </p>
          </div>

          {/* Cover Image URL */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("addGameModal.gameInfo.coverImage")}
            </label>
            <input
              type="text"
              value={formData.cover_image}
              onChange={(e) => handleInputChange("cover_image", e.target.value)}
              className="w-full bg-black/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rog-blue"
              placeholder={t("addGameModal.gameInfo.coverImagePlaceholder")}
            />
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
            onClick={handleSubmit}
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
