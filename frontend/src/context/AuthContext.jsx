import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {SignService} from '../api/SignService';

const AuthContext = createContext();

const getStorage = () => {
    if (localStorage.getItem('sign_id')) return localStorage;
    if (sessionStorage.getItem('sign_id')) return sessionStorage;
    return sessionStorage;
};

export function AuthProvider({ children }) {
    const navigate = useNavigate();

    const [token, setToken] = useState(() => sessionStorage.getItem('token') || localStorage.getItem('token'));
    const [signId, setSignId] = useState(() => sessionStorage.getItem('sign_id') || localStorage.getItem('sign_id'));
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const refreshIntervalRef = useRef(null);

    const signService = new SignService();

    useEffect(() => {
        if (signId) {
            refreshAuthToken(signId);
        } else {
            setIsAuthLoading(false);
        }

        return () => {
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (!signId || !token) {
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
            return;
        }
        refreshIntervalRef.current = setInterval(() => {
            refreshAuthToken(signId);
        }, 4 * 60 * 1000);
        return () => {
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
        };
    }, [signId, token]);

    const refreshAuthToken = async (currentSignId) => {
        setIsAuthLoading(true);
        try {
            const res = signService.refresh(currentSignId);

            const storage = getStorage();
            storage.setItem('token', res.token);

            setToken(res.token);
            setSignId(currentSignId);
        } catch (err) {
            if (err?.status === 401) {
                logout();
            } else {
                setIsAuthLoading(false);
            }
        } finally {
            setIsAuthLoading(false);
        }
    };

    const login = (newToken, newSignId, rememberMe) => {
        localStorage.removeItem('token');
        localStorage.removeItem('sign_id');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('sign_id');

        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('token', newToken);
        storage.setItem('sign_id', newSignId);

        setToken(newToken);
        setSignId(newSignId);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('sign_id');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('sign_id');

        setToken(null);
        setSignId(null);

        setIsAuthLoading(false);

        if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);

        navigate('/sign', { replace: true });
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{ token, signId, login, logout, isAuthLoading, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);