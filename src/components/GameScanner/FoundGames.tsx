import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, X, Plus } from 'lucide-react';
import { Game } from '../../types/game';

interface FoundGamesProps {
  foundGames: Game[];
  existingGames: Game[];
  onAddGame: (game: Game) => void;
  onAddAllGames: () => void;
  onClose: () => void;
}

const FoundGames: React.FC<FoundGamesProps> = ({
  foundGames,
  existingGames,
  onAddGame,
  onAddAllGames,
  onClose,
}) => {
  const { t } = useTranslation();
  
  const newGames = foundGames.filter(
    (game) => !existingGames.some((g) => g.title === game.title)
  );

  if (newGames.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-white/10 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">
          {t('gameUI.foundGames.title')}
        </h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={onAddAllGames}
            className="bg-rog-blue px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>{t('gameUI.foundGames.importAll')}</span>
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {newGames.map((game) => (
          <div
            key={game.id}
            className="bg-black/20 rounded-lg p-4 flex items-center space-x-3"
          >
            <img
              src={game.cover_image}
              alt={game.title}
              className="w-12 h-12 rounded object-cover"
            />
            <div className="flex-1">
              <h4 className="font-medium">{game.title}</h4>
              <p className="text-sm text-gray-400">{game.platform}</p>
            </div>
            <button
              onClick={() => onAddGame(game)}
              className="bg-rog-blue/20 hover:bg-rog-blue/30 text-rog-blue p-2 rounded-lg transition-colors group relative"
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="absolute bg-black/90 text-white text-xs px-2 py-1 rounded -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {t('gameUI.foundGames.addToLibrary')}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoundGames;