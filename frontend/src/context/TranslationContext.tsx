import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { en } from '../locales/en';
import { pl } from '../locales/pl';

const translations: Record<string, any> = { pl, en };

interface TranslationContextType {
    t: (path: string) => string;
    lang: string;
    setLanguage: (newLang: string) => void;
}

const DEFAULT_LANG = 'pl';

const isSupportedLang = (lang: string | null): lang is string =>
    lang !== null && Object.prototype.hasOwnProperty.call(translations, lang);

const getInitialLang = (): string => {
    const stored = localStorage.getItem('lang');
    return isSupportedLang(stored) ? stored : DEFAULT_LANG;
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
    children: ReactNode;
}

export const TranslationProvider = ({ children }: TranslationProviderProps) => {
    const [lang, setLang] = useState<string>(getInitialLang);

    const t = useCallback(
        (path: string): string => {
            const result = path.split('.').reduce((obj: any, key: string) => obj?.[key], translations[lang]);
            return typeof result === 'string' ? result : path;
        },
        [lang],
    );

    const setLanguage = useCallback((newLang: string) => {
        const validLang = isSupportedLang(newLang) ? newLang : DEFAULT_LANG;
        setLang(validLang);
        localStorage.setItem('lang', validLang);
    }, []);

    const value = useMemo(() => ({ t, lang, setLanguage }), [t, lang, setLanguage]);

    return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
};

export const useTranslation = (): TranslationContextType => {
    const context = useContext(TranslationContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    return context;
};
