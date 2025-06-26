import React from 'react';
import { useTheme } from '../hooks/useTheme';

const ThemeTest: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-game-card rounded-lg shadow-lg border border-theme">
      <p className="text-sm text-secondary">Current theme: <span className="font-bold text-primary">{theme}</span></p>
      <div className="mt-2 space-y-2">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-game-dark rounded"></div>
          <span className="text-xs">bg-game-dark</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-game-card rounded"></div>
          <span className="text-xs">bg-game-card</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-rog-blue rounded"></div>
          <span className="text-xs">bg-rog-blue</span>
        </div>
      </div>
    </div>
  );
};

export default ThemeTest;