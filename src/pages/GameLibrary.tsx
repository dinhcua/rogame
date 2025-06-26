import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GameScanner } from '../components/GameScanner';
import { GameFilters } from '../components/GameFilters';
import { GameCard, AddGameCard } from '../components/GameCard';
import AddGameModal from '../components/AddGameModal';
import DeleteGameModal from '../components/DeleteGameModal';
import { useGames } from '../hooks/useGames';
import { useGameFilters } from '../hooks/useGameFilters';
import { useGameActions } from '../hooks/useGameActions';
import '../i18n/config';

const GameLibrary: React.FC = () => {
  const { t } = useTranslation();
  const { games } = useGames();
  const {
    filters,
    setSearchQuery,
    setSelectedPlatform,
    setSelectedCategory,
    setSortBy,
    filteredGames,
  } = useGameFilters(games);
  
  const { deleteModal, handleDeleteClick, handleToggleFavorite } = useGameActions();
  const [showAddGameModal, setShowAddGameModal] = useState(false);

  return (
    <div className="bg-game-dark text-white font-sans">
      <div>
        {/* Game Scanner Section */}
        <GameScanner existingGames={games} />

        {/* Filters and Search */}
        <GameFilters
          filters={filters}
          onSearchChange={setSearchQuery}
          onPlatformChange={setSelectedPlatform}
          onCategoryChange={setSelectedCategory}
          onSortChange={setSortBy}
        />

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDeleteClick}
            />
          ))}
          <AddGameCard onClick={() => setShowAddGameModal(true)} />
        </div>
      </div>

      {/* Modals */}
      <AddGameModal
        isOpen={showAddGameModal}
        onClose={() => setShowAddGameModal(false)}
        onAdd={(gameData) => {
          console.log('Adding game:', gameData);
          // TODO: Implement adding game to library
        }}
      />

      <DeleteGameModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        onDelete={deleteModal.onDelete}
        gameTitle={deleteModal.gameToDelete?.title || ''}
        includeSaveFiles={deleteModal.includeSaveFiles}
        setIncludeSaveFiles={deleteModal.setIncludeSaveFiles}
        isDeleting={deleteModal.isDeleting}
        error={deleteModal.error}
      />
    </div>
  );
};

export default GameLibrary;