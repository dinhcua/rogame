import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../i18n/config";

interface Option {
  value: string;
  label: string;
}

interface DropdownSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  isSearchable?: boolean;
}

const DropdownSelect: React.FC<DropdownSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className = "",
  icon,
  isSearchable = false,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on search query
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected option label
  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/10 rounded-lg px-4 py-2.5 text-left focus:outline-none focus:ring-2 focus:ring-rog-blue flex items-center justify-between"
      >
        <div className="flex items-center space-x-2">
          {icon && <span className="text-gray-400">{icon}</span>}
          <span className={selectedOption ? "text-white" : "text-gray-400"}>
            {selectedOption ? selectedOption.label : t(placeholder)}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transform transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-game-card rounded-lg shadow-lg border border-white/10 py-1 max-h-60 overflow-auto">
          {isSearchable && (
            <div className="px-3 py-2 border-b border-white/10">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("dropdown.searchPlaceholder")}
                className="w-full bg-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rog-blue"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full px-4 py-2 text-left hover:bg-white/5 transition-colors flex items-center space-x-2 ${
                  option.value === value ? "text-rog-blue" : "text-white"
                }`}
              >
                <span>{option.label}</span>
                {option.value === value && (
                  <Check className="w-4 h-4 ml-auto" />
                )}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-400 text-sm">
              {t("dropdown.noOptions")}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DropdownSelect;
