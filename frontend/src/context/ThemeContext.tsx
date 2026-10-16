import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface ThemeContextType {
    theme: string;
    setTheme: (newTheme: string) => void;
    toggleTheme: () => void;
}

const THEMES = ['light', 'dark'];

const getInitialTheme = (): string => {
    const stored = localStorage.getItem('theme');
    return stored && THEMES.includes(stored) ? stored : 'light';
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const [theme, setThemeState] = useState<string>(getInitialTheme);

    useEffect(() => {
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const setTheme = useCallback((newTheme: string) => {
        if (THEMES.includes(newTheme)) {
            setThemeState(newTheme);
        }
    }, []);

    const toggleTheme = useCallback(() => setThemeState((prev) => (prev === 'light' ? 'dark' : 'light')), []);

    const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
