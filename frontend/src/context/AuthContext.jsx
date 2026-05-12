import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {SignService} from '../api/SignService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const navigate = useNavigate();

    const [token, setToken] = useState(sessionStorage.getItem('token') || localStorage.getItem('token'));
    const [signId, setSignId] = useState(sessionStorage.getItem('sign_id') || localStorage.getItem('sign_id'));
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    const signService = new SignService();

    useEffect(() => {
        if (signId) {
            refreshAuthToken(signId);
        } else {
            setIsAuthLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!signId) return;

        const interval = setInterval(() => {
            refreshAuthToken(signId);
        }, 4 * 60 * 1000);

        return () => clearInterval(interval);
    }, [signId]);

    const refreshAuthToken = async (currentSignId) => {
        try {
            const res = await signService.refresh(currentSignId);

            const isRemembered = !!localStorage.getItem('sign_id');
            const storage = isRemembered ? localStorage : sessionStorage;

            storage.setItem('token', res.token);
            setToken(res.token);
        } catch (err) {
            logout();
        } finally {
            setIsAuthLoading(false);
        }
    };

    const login = (newToken, newSignId, rememberMe) => {
        const storage = rememberMe ? localStorage : sessionStorage;

        storage.setItem('token', newToken);
        storage.setItem('sign_id', newSignId);

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

export const useAuth = () => useContext(AuthContext);