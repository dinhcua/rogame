import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface ScanProgressProps {
  progress: {
    percentage: number;
    steamGamesCount: number;
    epicGamesCount: number;
  };
}

const ScanProgress: React.FC<ScanProgressProps> = ({ progress }) => {
  const { t } = useTranslation();

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-secondary">
          {t('gameUI.scanner.scanning')}
        </span>
        <span className="text-sm text-secondary">{progress.percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2">
        <div
          className="bg-rog-blue h-2 rounded-full transition-all duration-150"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex items-center space-x-3 text-green-500">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm">
            {t('gameUI.scanner.steamFound', { count: progress.steamGamesCount })}
          </span>
        </div>
        <div className="flex items-center space-x-3 text-green-500">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm">
            {t('gameUI.scanner.epicFound', { count: progress.epicGamesCount })}
          </span>
        </div>
        <div className="flex items-center space-x-3 text-secondary">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">
            {t('gameUI.scanner.scanningGog')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ScanProgress;