import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { SignProvider } from '../api/providers/SignProvider';

interface AuthContextType {
    token: string | null;
    signId: string | null;
    login: (newToken: string, newSignId: string, rememberMe?: boolean) => void;
    logout: () => void;
    isAuthLoading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const navigate = useNavigate();

    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [signId, setSignId] = useState<string | null>(localStorage.getItem('success_sign_id'));
    const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

    const signProvider = new SignProvider();

    useEffect(() => {
        if (signId) {
            refreshAuthToken(signId);
        } else {
            setIsAuthLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!signId) return;

        const interval = setInterval(
            () => {
                refreshAuthToken(signId);
            },
            4 * 60 * 1000,
        );

        return () => clearInterval(interval);
    }, [signId]);

    const refreshAuthToken = async (currentSignId: string) => {
        try {
            const res = await signProvider.refresh(currentSignId);

            localStorage.setItem('token', res.token);

            if (getCookie('remember_me') === '1') {
                setCookie('token', res.token);
            }

            setToken(res.token);
        } catch (err) {
            logout();
        } finally {
            setIsAuthLoading(false);
        }
    };

    const login = (newToken: string, newSignId: string, rememberMe?: boolean) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('success_sign_id', newSignId);

        if (rememberMe) {
            setCookie('remember_me', rememberMe ? '1' : '0');
            setCookie('success_sign_id', newSignId);
        }

        setToken(newToken);
        setSignId(newSignId);
    };

    const logout = () => {
        localStorage.clear();
        deleteCookie('remember_me');
        deleteCookie('success_sign_id');

        setToken(null);
        setSignId(null);

        navigate('/sign', { replace: true });
    };

    const getCookie = (name: string): string | null => {
        const match = document.cookie.match(new RegExp('(^|;\\s*)' + encodeURIComponent(name) + '=([^;]*)'));
        return match ? decodeURIComponent(match[2]) : null;
    }

    const setCookie = (name: string, value: string, days: number = 30): void => {
        let expires = '';
        if (days > 0) {
            const date = new Date();
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
            expires = `; expires=${date.toUTCString()}`;
        }
        document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value) || ''}${expires}; path=/; SameSite=Lax`;
    }

    const deleteCookie = (name: string): void => {
        document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
    }

    return (
        <AuthContext.Provider value={{ token, signId, login, logout, isAuthLoading, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
