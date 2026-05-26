import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {useTranslation} from '../context/TranslationContext';

const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { t } = useTranslation();

    return (
        <>
            <nav className="navbar navbar-expand bg-white shadow-sm mb-4 border-bottom">
                <div className="container d-flex justify-content-between">
                    <Link to="/" className="navbar-brand fw-bold text-primary">{t('brand.sportgram')}</Link>
                    <div className="d-flex gap-2">
                        <Link to="/users" className="btn btn-sm btn-outline-primary" title={t('search')}><i className="bi bi-search"></i></Link>
                        <button className="btn btn-sm btn-outline-secondary" onClick={toggleTheme} title={theme === 'light' ? t('themes.dark') : t('themes.light')}>
                            {theme === 'light' ? <i className="bi bi-moon-fill"></i> : <i className="bi bi-sun-fill"></i>}
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={logout} title={t('logout') || 'Logout'}><i className="bi bi-box-arrow-right"></i></button>
                    </div>
                </div>
            </nav>
            {children}
        </>
    );
};

export default AuthenticatedLayout;
