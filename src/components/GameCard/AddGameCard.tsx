import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';

interface AddGameCardProps {
  onClick: () => void;
}

const AddGameCard: React.FC<AddGameCardProps> = ({ onClick }) => {
  const { t } = useTranslation();

  return (
    <div
      onClick={onClick}
      className="bg-game-card rounded-lg overflow-hidden border-2 border-dashed border-theme flex items-center justify-center h-[320px] cursor-pointer hover:border-rog-blue transition-colors group"
    >
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-rog-blue/20 transition-colors">
          <Plus className="w-8 h-8 text-secondary group-hover:text-rog-blue transition-colors" />
        </div>
        <h3 className="text-lg font-medium text-secondary group-hover:text-primary transition-colors">
          {t('gameUI.addGame.title')}
        </h3>
        <p className="text-sm text-secondary mt-2 max-w-[200px]">
          {t('gameUI.addGame.description')}
        </p>
      </div>
    </div>
  );
};

export default AddGameCard;