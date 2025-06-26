import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import ScanProgress from './ScanProgress';
import FoundGames from './FoundGames';
import { useGameScanner } from '../../hooks/useGameScanner';
import { Game } from '../../types/game';

interface GameScannerProps {
  existingGames: Game[];
}

const GameScanner: React.FC<GameScannerProps> = ({ existingGames }) => {
  const { t } = useTranslation();
  const {
    isScanning,
    scanProgress,
    showFoundGames,
    foundGames,
    startScan,
    addGameToLibrary,
    addAllNewGames,
    setShowFoundGames,
  } = useGameScanner();

  return (
    <div className="bg-game-card rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium mb-2">
            {t('gameUI.scanner.title')}
          </h2>
          <p className="text-gray-400">{t('gameUI.scanner.description')}</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={startScan}
            className="bg-rog-blue px-6 py-2.5 rounded-lg hover:bg-blue-500 transition-colors flex items-center space-x-2"
          >
            <Search className="w-5 h-5" />
            <span>{t('gameUI.scanner.scanButton')}</span>
          </button>
        </div>
      </div>

      {isScanning && <ScanProgress progress={scanProgress} />}

      {showFoundGames && foundGames.length > 0 && (
        <FoundGames
          foundGames={foundGames}
          existingGames={existingGames}
          onAddGame={addGameToLibrary}
          onAddAllGames={() => addAllNewGames(existingGames)}
          onClose={() => setShowFoundGames(false)}
        />
      )}
    </div>
  );
};

export default GameScanner;