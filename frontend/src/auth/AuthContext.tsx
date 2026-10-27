import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import { useMantineColorScheme } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { authStorage } from '../api/client';
import { authService, userService, type UserResource } from '../api/services';
import { RoleEnum } from '../enums/RoleEnum';
import { LanguageEnum } from '../enums/LanguageEnum';
import { ThemeEnum } from '../enums/ThemeEnum';

export type User = UserResource;

interface AuthContextType {
    token: string | null;
    signId: string | null;
    currentUser: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isAdmin: boolean;
    isOrganizer: boolean;
    isParticipant: boolean;
    login: (token: string, signId: string, rememberMe: boolean) => void;
    logout: () => void;
    refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const REFRESH_INTERVAL_MS = 4 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(authStorage.getToken());
    const [signId, setSignId] = useState<string | null>(authStorage.getSignId());
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(!!signId);

    const { setColorScheme } = useMantineColorScheme();
    const { i18n } = useTranslation();

    const logout = useCallback(() => {
        authStorage.clear();
        setToken(null);
        setSignId(null);
        setCurrentUser(null);
        setIsLoading(false);
    }, []);

    const login = useCallback((newToken: string, newSignId: string, rememberMe: boolean) => {
        authStorage.save(newToken, newSignId, rememberMe);
        setToken(newToken);
        setSignId(newSignId);
    }, []);

    const fetchUser = useCallback(
        async (currentSignId: string) => {
            try {
                const user = await userService.getUserBySignId(currentSignId);
                if (!user) {
                    logout();
                    return;
                }
                setCurrentUser(user);
            } catch {
                logout();
            } finally {
                setIsLoading(false);
            }
        },
        [logout],
    );

    const refetchUser = useCallback(async () => {
        if (!signId || !token) {
            setCurrentUser(null);
            setIsLoading(false);
            return;
        }
        await fetchUser(signId);
    }, [signId, token, fetchUser]);

    // Fetch user on initial load or when signId/token changes (NO infinite loop)
    useEffect(() => {
        if (signId && token) {
            setIsLoading(true);
            fetchUser(signId);
        } else {
            setCurrentUser(null);
            setIsLoading(false);
        }
    }, [signId, token, fetchUser]);

    // Sync language and theme from user profile ONCE when currentUser.id changes
    useEffect(() => {
        if (!currentUser) return;

        const targetLang = currentUser.language === LanguageEnum.ENGLISH ? 'en' : 'pl';
        if (i18n.language !== targetLang) {
            i18n.changeLanguage(targetLang);
        }

        const targetTheme = currentUser.theme === ThemeEnum.DARK ? 'dark' : 'light';
        setColorScheme(targetTheme);
    }, [currentUser?.id, currentUser?.language, currentUser?.theme, setColorScheme, i18n]);

    // Periodic token refresh every 4 minutes
    useEffect(() => {
        if (!signId) return;
        const interval = setInterval(async () => {
            try {
                const data = await authService.refreshSign(signId);
                if (data?.token) {
                    authStorage.setToken(data.token);
                    setToken(data.token);
                } else {
                    logout();
                }
            } catch {
                logout();
            }
        }, REFRESH_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [signId, logout]);

    const isAdmin = useMemo(
        () => currentUser?.roles?.some((r) => r.role === RoleEnum.ADMINISTRATOR) ?? false,
        [currentUser],
    );
    const isOrganizer = useMemo(
        () => currentUser?.roles?.some((r) => r.role === RoleEnum.ORGANIZER) ?? false,
        [currentUser],
    );
    const isParticipant = useMemo(
        () => currentUser?.roles?.some((r) => r.role === RoleEnum.PARTICIPANT) ?? false,
        [currentUser],
    );

    const value = useMemo(
        () => ({
            token,
            signId,
            currentUser,
            isAuthenticated: !!token && !!currentUser,
            isLoading,
            isAdmin,
            isOrganizer,
            isParticipant,
            login,
            logout,
            refetchUser,
        }),
        [token, signId, currentUser, isLoading, isAdmin, isOrganizer, isParticipant, login, logout, refetchUser],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
