import { useState, useMemo } from 'react';
import { Game } from '../types/game';

export interface FilterOptions {
  searchQuery: string;
  selectedPlatform: string;
  selectedCategory: string;
  sortBy: string;
}

export const CATEGORY_MAPPING = {
  'gameUI.categories.allGames': 'all',
  'gameUI.categories.recentlyPlayed': 'recent',
  'gameUI.categories.favorites': 'favorites',
  'gameUI.categories.actionRPG': 'Action RPG',
  'gameUI.categories.rpg': 'RPG',
  'gameUI.categories.strategy': 'Strategy',
  'gameUI.categories.action': 'Action',
  'gameUI.categories.adventure': 'Adventure',
  'gameUI.categories.jrpg': 'JRPG',
  'gameUI.categories.survivalHorror': 'Survival Horror',
} as const;

export const useGameFilters = (games: Game[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('All Platforms');
  const [selectedCategory, setSelectedCategory] = useState('gameUI.categories.allGames');
  const [sortBy, setSortBy] = useState('name');

  const filteredGames = useMemo(() => {
    return games
      .filter((game) => {
        const matchesSearch = game.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesPlatform =
          selectedPlatform === 'All Platforms' ||
          game.platform === selectedPlatform;

        const selectedInternalCategory =
          CATEGORY_MAPPING[selectedCategory as keyof typeof CATEGORY_MAPPING];

        const matchesCategory =
          selectedInternalCategory === 'all' ||
          (selectedInternalCategory === 'recent' &&
            game.last_played !== 'Just added') ||
          (selectedInternalCategory === 'favorites' && game.is_favorite) ||
          game.category === selectedInternalCategory;

        return matchesSearch && matchesPlatform && matchesCategory;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.title.localeCompare(b.title);
          case 'last_played':
            return a.last_played.localeCompare(b.last_played);
          case 'save_count':
            return b.save_count - a.save_count;
          case 'size':
            return parseInt(b.size) - parseInt(a.size);
          default:
            return 0;
        }
      });
  }, [games, searchQuery, selectedPlatform, selectedCategory, sortBy]);

  return {
    filters: {
      searchQuery,
      selectedPlatform,
      selectedCategory,
      sortBy,
    },
    setSearchQuery,
    setSelectedPlatform,
    setSelectedCategory,
    setSortBy,
    filteredGames,
  };
};