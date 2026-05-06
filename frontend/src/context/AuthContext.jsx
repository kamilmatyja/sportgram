import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const navigate = useNavigate();

    const [token, setToken] = useState(sessionStorage.getItem('token') || localStorage.getItem('token'));
    const [signId, setSignId] = useState(sessionStorage.getItem('signId') || localStorage.getItem('signId'));
    const [isAuthLoading, setIsAuthLoading] = useState(true);

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
            const res = await apiFetch(`/api/signs/${currentSignId}/refresh`, { method: 'POST' });

            const isRemembered = !!localStorage.getItem('signId');
            const storage = isRemembered ? localStorage : sessionStorage;

            storage.setItem('token', res.token);
            setToken(res.token);
            setSignId(currentSignId);
        } catch (err) {
            logout();
        } finally {
            setIsAuthLoading(false);
        }
    };

    const login = (newToken, newSignId, rememberMe) => {
        const storage = rememberMe ? localStorage : sessionStorage;

        storage.setItem('token', newToken);
        storage.setItem('signId', newSignId);

        setToken(newToken);
        setSignId(newSignId);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('signId');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('signId');
        sessionStorage.removeItem('sportgram_sign_state');
        sessionStorage.removeItem('sportgram_register_state');
        sessionStorage.removeItem('sportgram_auto_sign');
        sessionStorage.removeItem('sportgram_unconfirmed');

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