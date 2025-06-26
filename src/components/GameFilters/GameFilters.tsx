import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ShoppingBag, SlidersHorizontal } from 'lucide-react';
import DropdownSelect from '../DropdownSelect';
import SearchBar from './SearchBar';
import CategoryFilter from './CategoryFilter';

interface GameFiltersProps {
  filters: {
    searchQuery: string;
    selectedPlatform: string;
    selectedCategory: string;
    sortBy: string;
  };
  onSearchChange: (value: string) => void;
  onPlatformChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

const GameFilters: React.FC<GameFiltersProps> = ({
  filters,
  onSearchChange,
  onPlatformChange,
  onCategoryChange,
  onSortChange,
}) => {
  const { t } = useTranslation();

  const platformOptions = [
    { value: 'All Platforms', label: t('gameUI.platforms.all') },
    { value: 'Steam', label: t('gameUI.platforms.steam') },
    { value: 'Epic Games', label: t('gameUI.platforms.epic') },
    { value: 'GOG', label: t('gameUI.platforms.gog') },
    { value: 'Origin', label: t('gameUI.platforms.origin') },
  ];

  const sortOptions = [
    { value: 'name', label: t('gameUI.sort.byName') },
    { value: 'last_played', label: t('gameUI.sort.byLastPlayed') },
    { value: 'save_count', label: t('gameUI.sort.bySaveCount') },
    { value: 'size', label: t('gameUI.sort.bySize') },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SearchBar
            value={filters.searchQuery}
            onChange={onSearchChange}
            placeholder={t('gameUI.filters.search')}
          />
          <DropdownSelect
            options={platformOptions}
            value={filters.selectedPlatform}
            onChange={onPlatformChange}
            placeholder={t('gameUI.filters.platform')}
            icon={<ShoppingBag className="w-5 h-5" />}
          />
          <DropdownSelect
            options={sortOptions}
            value={filters.sortBy}
            onChange={onSortChange}
            placeholder={t('gameUI.filters.sortBy')}
            icon={<SlidersHorizontal className="w-5 h-5" />}
          />
        </div>
      </div>
      
      <CategoryFilter
        selectedCategory={filters.selectedCategory}
        onCategoryChange={onCategoryChange}
      />
    </div>
  );
};

export default GameFilters;