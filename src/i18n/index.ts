import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import zh from "./zh.json";
import en from "./en.json";

// Get language from localStorage or system preference
const getInitialLanguage = () => {
  const saved = localStorage.getItem("preferredLanguage");
  if (saved && ["en", "zh"].includes(saved)) {
    return saved;
  }
  // Fallback to system language detection
  const detector = new LanguageDetector();
  const detected = detector.detect();
  return detected && detected.includes("zh") ? "zh" : "en";
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zh },
      en: { translation: en },
    },
    lng: getInitialLanguage(),
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
