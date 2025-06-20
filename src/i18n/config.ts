import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslations from "./en.json";
import viTranslations from "./vi.json";

// Get stored language from localStorage or default to 'en'
const storedLanguage = localStorage.getItem("language") || "en";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enTranslations,
    },
    vi: {
      translation: viTranslations,
    },
  },
  lng: storedLanguage, // Use stored language
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

// Add language change listener to update localStorage
i18n.on("languageChanged", (lng) => {
  localStorage.setItem("language", lng);
});

export default i18n;
