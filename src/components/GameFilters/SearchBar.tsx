import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder }) => {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-game-card border border-theme rounded-lg pl-10 pr-4 py-2 w-64 text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-rog-blue"
      />
      <Search className="w-5 h-5 text-secondary absolute left-3 top-2.5" />
    </div>
  );
};

export default SearchBar;