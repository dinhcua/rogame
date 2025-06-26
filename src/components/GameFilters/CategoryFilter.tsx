import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { CATEGORY_MAPPING } from '../../hooks/useGameFilters';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  const { t } = useTranslation();
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  
  const categories = Object.keys(CATEGORY_MAPPING);

  return (
    <div className="flex flex-wrap gap-4">
      {categories
        .slice(0, showMoreCategories ? undefined : 6)
        .map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`${
              selectedCategory === category
                ? 'bg-rog-blue'
                : 'bg-white/10 hover:bg-white/20'
            } px-4 py-2 rounded-lg transition-colors whitespace-nowrap`}
          >
            {t(category)}
          </button>
        ))}
      {categories.length > 6 && (
        <button
          onClick={() => setShowMoreCategories(!showMoreCategories)}
          className="bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors whitespace-nowrap flex items-center space-x-1"
        >
          <span>
            {showMoreCategories
              ? t('gameUI.categories.less')
              : t('gameUI.categories.more')}
          </span>
          <ChevronDown
            className={`w-4 h-4 transform transition-transform ${
              showMoreCategories ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}
    </div>
  );
};

export default CategoryFilter;