import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import { useMantineColorScheme } from '@mantine/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { authStorage } from '../api/client';
import { authService, userService, type UserResource } from '../api/services';
import { LanguageEnum } from '../enums/LanguageEnum';
import { RoleEnum } from '../enums/RoleEnum';
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
    const queryClient = useQueryClient();
    const [token, setToken] = useState<string | null>(authStorage.getToken());
    const [signId, setSignId] = useState<string | null>(authStorage.getSignId());

    const { setColorScheme } = useMantineColorScheme();
    const { i18n } = useTranslation();

    const logout = useCallback(() => {
        authStorage.clear();
        setToken(null);
        setSignId(null);
        queryClient.removeQueries({ queryKey: ['currentUser'] });
    }, [queryClient]);

    const login = useCallback((newToken: string, newSignId: string, rememberMe: boolean) => {
        authStorage.save(newToken, newSignId, rememberMe);
        setToken(newToken);
        setSignId(newSignId);
    }, []);

    const {
        data: currentUser = null,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ['currentUser', signId],
        queryFn: async () => {
            const res = await userService.getUsers({
                params: {
                    query: {
                        filter: { signId: signId!, userIds: null },
                        'include[]': ['userRoles', 'userDisciplines'],
                        limit: 1,
                    },
                },
            });
            const user = res.data?.[0];
            if (!user) throw new Error('User not found');
            return user;
        },
        enabled: !!(token && signId),
        retry: false,
    });

    useEffect(() => {
        if (isError) logout();
    }, [isError, logout]);

    const refetchUser = useCallback(async () => {
        if (token && signId) {
            await refetch();
        }
    }, [token, signId, refetch]);

    useEffect(() => {
        window.addEventListener('auth:logout', logout);
        return () => window.removeEventListener('auth:logout', logout);
    }, [logout]);

    useEffect(() => {
        if (!currentUser) return;

        const targetLang = currentUser.language === LanguageEnum.ENGLISH ? 'en' : 'pl';
        if (i18n.language !== targetLang) {
            void i18n.changeLanguage(targetLang);
        }

        setColorScheme(currentUser.theme === ThemeEnum.DARK ? 'dark' : 'light');
    }, [currentUser?.language, currentUser?.theme, setColorScheme, i18n]);

    const refreshSession = useCallback(async () => {
        if (!signId) return;
        try {
            const data = await authService.refreshSign({ params: { path: { id: signId } } });
            if (data?.token) {
                authStorage.setToken(data.token);
                setToken(data.token);
            } else {
                logout();
            }
        } catch {
            logout();
        }
    }, [signId, logout]);

    useEffect(() => {
        if (!signId) return;

        const interval = setInterval(() => {
            void refreshSession();
        }, REFRESH_INTERVAL_MS);

        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                void refreshSession();
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void refreshSession();
            }
        };

        window.addEventListener('pageshow', handlePageShow);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener('pageshow', handlePageShow);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [signId, refreshSession]);

    const userRoles = useMemo(() => new Set(currentUser?.roles?.map((r) => r.role)), [currentUser]);
    const isAdmin = userRoles.has(RoleEnum.ADMINISTRATOR);
    const isOrganizer = userRoles.has(RoleEnum.ORGANIZER);
    const isParticipant = userRoles.has(RoleEnum.PARTICIPANT);

    const value = useMemo(
        () => ({
            token,
            signId,
            currentUser,
            isAuthenticated: !!token && !!currentUser,
            isLoading: !!(token && signId) && isLoading,
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
