import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Dil dosyalarını import et
import tr from './tr.json';
import en from './en.json';
import ar from './ar.json';

export const resources = {
  tr: {
    translation: tr
  },
  en: {
    translation: en
  },
  ar: {
    translation: ar
  }
} as const;

export const availableLanguages = {
  tr: 'Türkçe',
  en: 'English', 
  ar: 'العربية'
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'tr', // Varsayılan dil Türkçe
    debug: import.meta.env.DEV,

    interpolation: {
      escapeValue: false, // React zaten XSS koruması sağlıyor
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'kimyalab-language',
    },

    react: {
      useSuspense: false
    }
  });

export default i18n;