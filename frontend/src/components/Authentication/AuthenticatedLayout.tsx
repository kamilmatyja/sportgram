import React, {useEffect, useState} from 'react';
import {Link, NavLink} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import {useTranslation} from '../../context/TranslationContext';
import {useAppAccess} from '../../utils/hooks/useAppAccess';

const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const {logout} = useAuth();
    const {t} = useTranslation();
    const [isNavOpen, setIsNavOpen] = useState<boolean>(false);
    const [userLink, setUserLink] = useState<string | null>(null);
    const {currentUser} = useAppAccess();

    useEffect(() => {
        if (currentUser && currentUser.link) {
            setUserLink(currentUser.link);
        }
    }, [currentUser]);

    const toggleNav = () => setIsNavOpen(!isNavOpen);
    const closeNav = () => setIsNavOpen(false);

    return (
        <>
            <nav className="navbar navbar-expand-lg bg-white shadow-sm mb-4 border-bottom sticky-top">
                <div className="container">
                    <Link to="/" className="navbar-brand fw-bold text-primary" onClick={closeNav}>
                        {t('brand.sportgram')}
                    </Link>

                    <button
                        className="navbar-toggler border-0"
                        type="button"
                        onClick={toggleNav}
                        aria-expanded={isNavOpen}
                        aria-label={t('nav.toggle')}
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className={`collapse navbar-collapse ${isNavOpen ? 'show' : ''}`}>
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1 mt-3 mt-lg-0">
                            <li className="nav-item">
                                <NavLink
                                    to="/"
                                    end
                                    className={({isActive}) => `nav-link rounded px-3 ${isActive ? 'active bg-light text-primary fw-bold' : ''}`}
                                    onClick={closeNav}
                                >
                                    <i className="bi bi-house-door me-2 d-lg-none"></i>{t('nav.home')}
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink
                                    to="/users"
                                    end
                                    className={({isActive}) => `nav-link rounded px-3 ${isActive ? 'active bg-light text-primary fw-bold' : ''}`}
                                    onClick={closeNav}
                                >
                                    <i className="bi bi-people me-2 d-lg-none"></i>{t('nav.users')}
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink
                                    to="/pages"
                                    end
                                    className={({isActive}) => `nav-link rounded px-3 ${isActive ? 'active bg-light text-primary fw-bold' : ''}`}
                                    onClick={closeNav}
                                >
                                    <i className="bi bi-file-earmark-text me-2 d-lg-none"></i>{t('nav.pages')}
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink
                                    to="/events"
                                    end
                                    className={({isActive}) => `nav-link rounded px-3 ${isActive ? 'active bg-light text-primary fw-bold' : ''}`}
                                    onClick={closeNav}
                                >
                                    <i className="bi bi-calendar-event me-2 d-lg-none"></i>{t('nav.events')}
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink
                                    to="/statistics"
                                    end
                                    className={({isActive}) => `nav-link rounded px-3 ${isActive ? 'active bg-light text-primary fw-bold' : ''}`}
                                    onClick={closeNav}
                                >
                                    <i className="bi bi-graph-up me-2 d-lg-none"></i>{t('nav.statistics')}
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink
                                    to={`/users/${userLink}`}
                                    end
                                    className={({isActive}) => `nav-link rounded px-3 ${isActive ? 'active bg-light text-primary fw-bold' : ''}`}
                                    onClick={closeNav}
                                >
                                    <i className="bi bi-person me-2 d-lg-none"></i>{t('nav.profile')}
                                </NavLink>
                            </li>
                        </ul>

                        <div className="d-flex align-items-center gap-2 mt-3 mt-lg-0 pt-3 pt-lg-0">
                            <button
                                className="btn btn-sm btn-danger w-100 w-lg-auto text-start text-lg-center"
                                onClick={() => {
                                    closeNav();
                                    logout();
                                }}
                                title={t('logout')}
                            >
                                <i className="bi bi-box-arrow-right"></i>
                                <span className="d-inline-block d-lg-none ms-2">{t('logout')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            {children}
        </>
    );
};

export default AuthenticatedLayout;