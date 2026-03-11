import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enUi from './locales/en/ui.json';
import frUi from './locales/fr/ui.json';
import arUi from './locales/ar/ui.json';

import enQuestions from './locales/en/questions.json';
import frQuestions from './locales/fr/questions.json';
import arQuestions from './locales/ar/questions.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { ui: enUi, questions: enQuestions },
            fr: { ui: frUi, questions: frQuestions },
            ar: { ui: arUi, questions: arQuestions },
        },
        fallbackLng: 'en',
        defaultNS: 'ui',
        ns: ['ui', 'questions'],
        interpolation: { escapeValue: false },
        detection: {
            order: ['localStorage'],
            lookupLocalStorage: 'draftArena_lang',
            caches: ['localStorage'],
        },
    });

// Set document direction and lang on language change
const updateDir = (lng) => {
    const dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lng;
};

updateDir(i18n.language);
i18n.on('languageChanged', updateDir);

export default i18n;
