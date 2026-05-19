import {createContext, ReactNode, useContext, useState} from 'react';
import {pl} from '../locales/pl';
import {en} from '../locales/en';

const translations: Record<string, any> = {pl, en};

interface TranslationContextType {
    t: (path: string) => string;
    lang: string;
    setLanguage: (newLang: string) => void;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
    children: ReactNode;
}

export const TranslationProvider = ({children}: TranslationProviderProps) => {
    const [lang, setLang] = useState<string>(localStorage.getItem('lang') || 'pl');

    const t = (path: string): string => {
        const result = path.split('.').reduce((obj: any, key: string) => obj?.[key], translations[lang]);
        return typeof result === 'string' ? result : path;
    };

    const setLanguage = (newLang: string) => {
        setLang(newLang);
        localStorage.setItem('lang', newLang);
    };

    return (
        <TranslationContext.Provider value={{t, lang, setLanguage}}>
            {children}
        </TranslationContext.Provider>
    );
};

export const useTranslation = (): TranslationContextType => {
    const context = useContext(TranslationContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    return context;
};