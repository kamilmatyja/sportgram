import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { SignProvider } from '../api/providers/SignProvider';

interface AuthContextType {
    token: string | null;
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

export function AuthProvider({ children }: AuthProviderProps) {
    const navigate = useNavigate();

    const [token, setToken] = useState<string | null>(sessionStorage.getItem('token') || localStorage.getItem('token'));
    const [signId, setSignId] = useState<string | null>(
        sessionStorage.getItem('success_sign_id') || localStorage.getItem('success_sign_id'),
    );
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

            const isRemembered = !!localStorage.getItem('success_sign_id');
            const storage = isRemembered ? localStorage : sessionStorage;

            storage.setItem('token', res.token);
            setToken(res.token);
        } catch (err) {
            logout();
        } finally {
            setIsAuthLoading(false);
        }
    };

    const login = (newToken: string, newSignId: string, rememberMe: boolean) => {
        const storage = rememberMe ? localStorage : sessionStorage;

        storage.setItem('token', newToken);
        storage.setItem('success_sign_id', newSignId);

        setToken(newToken);
        setSignId(newSignId);
    };

    const logout = () => {
        localStorage.clear();
        sessionStorage.clear();

        setToken(null);
        setSignId(null);

        navigate('/sign', { replace: true });
    };

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
