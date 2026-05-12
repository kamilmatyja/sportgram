import { createContext, useContext, useState } from 'react';
import { pl } from '../locales/pl';
import { en } from '../locales/en';

const translations = { pl, en };
const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
    const [lang, setLang] = useState(localStorage.getItem('lang') || 'pl');

    const t = (path) => {
        return path.split('.').reduce((obj, key) => obj?.[key], translations[lang]) || path;
    };

    const setLanguage = (newLang) => {
        setLang(newLang);
        localStorage.setItem('lang', newLang);
    };

    return (
        <TranslationContext.Provider value={{ t, lang, setLanguage }}>
            {children}
        </TranslationContext.Provider>
    );
};

export const useTranslation = () => useContext(TranslationContext);