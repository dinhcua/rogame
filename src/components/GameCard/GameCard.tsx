import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Star, Trash2, File } from 'lucide-react';
import { Game } from '../../types/game';
import { formatBackupTime } from '../../utils/time';
import PlatformIcon from '../PlatformIcon';

interface GameCardProps {
  game: Game;
  onToggleFavorite: (gameId: string) => void;
  onDelete: (game: Game) => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onToggleFavorite, onDelete }) => {
  const { t } = useTranslation();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(game.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(game);
  };

  return (
    <div className="relative group">
      <a
        href={`/game/${game.id}`}
        className="block bg-game-card h-[320px] rounded-lg overflow-hidden group hover:ring-2 hover:ring-rog-blue transition-all"
      >
        <div className="relative">
          <img
            src={game.cover_image}
            alt={game.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-3 right-3 flex items-center space-x-2">
            <span
              className={`${
                game.status === 'has_saves'
                  ? 'bg-green-500/90'
                  : 'bg-yellow-500/90'
              } text-white px-2 py-1 rounded text-sm`}
            >
              {game.status === 'has_saves'
                ? t('gameUI.status.hasSaves')
                : t('gameUI.status.noSaves')}
            </span>
            <button
              onClick={handleFavoriteClick}
              className={`bg-black/50 p-1.5 rounded-lg hover:bg-black/70 transition-colors ${
                game.is_favorite ? 'text-yellow-500' : 'text-white'
              }`}
            >
              <Star
                className={`w-5 h-5 ${
                  game.is_favorite ? 'fill-current' : ''
                }`}
              />
            </button>
            <button
              onClick={handleDeleteClick}
              className="bg-black/50 p-1.5 rounded-lg hover:bg-red-500/70 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium group-hover:text-rog-blue transition-colors">
              {game.title}
            </h3>
            <div className="flex items-center space-x-1 text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {!game.last_backup_time
                  ? t('gameUI.backup.never')
                  : formatBackupTime(game.last_backup_time, t)}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 mb-3">
            <PlatformIcon
              platform={game.platform}
              className="w-5 h-5 brightness-0 invert opacity-70"
            />
            <span className="text-sm text-gray-400">
              {game.platform}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <File className="w-5 h-5 text-gray-400" />
              <span className="text-sm">
                {t('gameUI.saveCount', { count: game.save_count })}
              </span>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};

export default GameCard;