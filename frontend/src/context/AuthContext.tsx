import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { SignProvider } from '../api/providers/SignProvider';
import { isApiError } from '../utils/api';
import { authStorage } from '../utils/authSession';

const REFRESH_INTERVAL_MS = 4 * 60 * 1000;

interface AuthContextType {
    signId: string | null;
    login: (newToken: string, newSignId: string, rememberMe: boolean) => void;
    logout: () => void;
    isAuthLoading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

function isSessionRejected(err: unknown): boolean {
    return isApiError(err) && err.status >= 400 && err.status < 500;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const navigate = useNavigate();

    const [token, setToken] = useState<string | null>(authStorage.getToken());
    const [signId, setSignId] = useState<string | null>(authStorage.getSignId());
    const [isAuthLoading, setIsAuthLoading] = useState<boolean>(!!signId);

    const signProvider = useRef(new SignProvider()).current;
    const skipNextRefresh = useRef(false);

    const logout = useCallback(() => {
        authStorage.clear();

        setToken(null);
        setSignId(null);

        navigate('/sign', { replace: true });
    }, [navigate]);

    const login = useCallback((newToken: string, newSignId: string, rememberMe: boolean) => {
        authStorage.save(newToken, newSignId, rememberMe);
        skipNextRefresh.current = true;

        setToken(newToken);
        setSignId(newSignId);
    }, []);

    const logoutRef = useRef(logout);
    logoutRef.current = logout;

    useEffect(() => {
        if (!signId) return;

        let cancelled = false;

        const refreshAuthToken = async () => {
            try {
                const res = await signProvider.refresh(signId);
                if (cancelled) return;
                authStorage.setToken(res.token);
                setToken(res.token);
            } catch (err) {
                if (!cancelled && isSessionRejected(err)) logoutRef.current();
            } finally {
                if (!cancelled) setIsAuthLoading(false);
            }
        };

        if (skipNextRefresh.current) {
            skipNextRefresh.current = false;
        } else {
            refreshAuthToken();
        }
        const interval = setInterval(refreshAuthToken, REFRESH_INTERVAL_MS);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [signId, signProvider]);

    const value = useMemo(
        () => ({ signId, login, logout, isAuthLoading, isAuthenticated: !!token }),
        [token, signId, login, logout, isAuthLoading],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
