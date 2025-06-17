import { useState } from "react";
import DropdownSelect from "./DropdownSelect";

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (gameData: any) => void;
}

const AddGameModal = ({ isOpen, onClose, onAdd }: AddGameModalProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState("");

  const platformOptions = [
    { value: "steam", label: "Steam" },
    { value: "epic", label: "Epic Games" },
    { value: "gog", label: "GOG" },
    { value: "origin", label: "Origin" },
    { value: "other", label: "Other" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-game-card rounded-lg w-full max-w-2xl mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-xl font-medium">Add New Game Manually</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Game Info Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Game Title
              </label>
              <input
                type="text"
                className="w-full bg-black/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rog-blue"
                placeholder="Enter game title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Platform
                </label>
                <DropdownSelect
                  options={platformOptions}
                  value={selectedPlatform}
                  onChange={setSelectedPlatform}
                  placeholder="Select platform"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Game Version
                </label>
                <input
                  type="text"
                  className="w-full bg-black/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rog-blue"
                  placeholder="e.g. 1.0.5"
                />
              </div>
            </div>
          </div>

          {/* Save Location Section */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Save Files Location
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-1 bg-black/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rog-blue"
                placeholder="Path to save files directory"
              />
              <button className="bg-white/10 px-4 rounded-lg hover:bg-white/20 transition-colors flex items-center space-x-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Browse</span>
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Common locations: %USERPROFILE%/Documents/My Games,
              %APPDATA%/Local
            </p>
          </div>

          {/* Save Pattern Section */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Save File Pattern
            </label>
            <input
              type="text"
              className="w-full bg-black/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rog-blue"
              placeholder="e.g. *.sav, save*.dat"
            />
            <p className="text-sm text-gray-400 mt-2">
              Use wildcards (*) to match multiple files
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
                Monitor save directory for changes
              </span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="w-5 h-5 rounded bg-black/20 border-white/20 text-rog-blue focus:ring-rog-blue focus:ring-offset-0"
              />
              <span className="text-sm">Create automatic backups</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="w-5 h-5 rounded bg-black/20 border-white/20 text-rog-blue focus:ring-rog-blue focus:ring-offset-0"
              />
              <span className="text-sm">Enable cloud sync</span>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // TODO: Implement form data collection and validation
              onAdd({});
              onClose();
            }}
            className="bg-rog-blue px-6 py-2.5 rounded-lg hover:bg-blue-500 transition-colors"
          >
            Add Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddGameModal;
