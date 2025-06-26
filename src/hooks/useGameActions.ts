import { useState, useCallback } from 'react';
import { Game } from '../types/game';
import useGameStore from '../store/gameStore';

export const useGameActions = () => {
  const { deleteGame, toggleFavorite } = useGameStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [includeSaveFiles, setIncludeSaveFiles] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteClick = useCallback((game: Game) => {
    setGameToDelete(game);
    setShowDeleteModal(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!gameToDelete) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);

      await deleteGame(gameToDelete.id, gameToDelete.title, includeSaveFiles);
      
      setShowDeleteModal(false);
      setGameToDelete(null);
      setIncludeSaveFiles(false);
    } catch (error) {
      console.error('Failed to delete game:', error);
      setDeleteError(
        error instanceof Error ? error.message : 'Failed to delete game'
      );
    } finally {
      setIsDeleting(false);
    }
  }, [gameToDelete, includeSaveFiles, deleteGame]);

  const handleDeleteCancel = useCallback(() => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setGameToDelete(null);
      setIncludeSaveFiles(false);
      setDeleteError(null);
    }
  }, [isDeleting]);

  const handleToggleFavorite = useCallback(async (gameId: string) => {
    try {
      await toggleFavorite(gameId);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }, [toggleFavorite]);

  return {
    deleteModal: {
      isOpen: showDeleteModal,
      gameToDelete,
      includeSaveFiles,
      isDeleting,
      error: deleteError,
      setIncludeSaveFiles,
      onDelete: handleDeleteConfirm,
      onClose: handleDeleteCancel,
    },
    handleDeleteClick,
    handleToggleFavorite,
  };
};