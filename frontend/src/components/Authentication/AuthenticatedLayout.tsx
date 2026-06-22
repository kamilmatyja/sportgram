import React, {useEffect, useState} from 'react';
import {NavLink} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import {useTranslation} from '../../context/TranslationContext';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import BootstrapIcon from '../Common/BootstrapIcon';
import {Navbar, Nav, Container, Button, Stack} from 'react-bootstrap';

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

    const closeNav = () => setIsNavOpen(false);

    return (
        <>
            <Navbar
                expanded={isNavOpen}
                onToggle={setIsNavOpen}
                expand="lg"
                bg="white"
                className="shadow-sm mb-4 border-bottom sticky-top"
            >
                <Container>
                    <Navbar.Brand as={NavLink} to="/" className="fw-bold text-primary" onClick={closeNav}>
                        {t('brand.sportgram')}
                    </Navbar.Brand>

                    <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0" />

                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto mb-2 mb-lg-0 gap-1 mt-3 mt-lg-0">
                            <NavLink to="/" end onClick={closeNav}
                                     className={({isActive}) => `nav-link rounded px-3 ${isActive ? 'active bg-light text-primary fw-bold' : ''}`}>
                                <BootstrapIcon name="house-door" className="me-2 d-lg-none" />{t('navHome')}
                            </NavLink>
                            <NavLink to="/users" end onClick={closeNav}
                                     className={({isActive}) => `nav-link rounded px-3 ${isActive ? 'active bg-light text-primary fw-bold' : ''}`}>
                                <BootstrapIcon name="people" className="me-2 d-lg-none" />{t('navUsers')}
                            </NavLink>
                            <NavLink to="/pages" end onClick={closeNav}
                                     className={({isActive}) => `nav-link rounded px-3 ${isActive ? 'active bg-light text-primary fw-bold' : ''}`}>
                                <BootstrapIcon name="file-earmark-text" className="me-2 d-lg-none" />{t('navPages')}
                            </NavLink>
                            <NavLink to="/events" end onClick={closeNav}
                                     className={({isActive}) => `nav-link rounded px-3 ${isActive ? 'active bg-light text-primary fw-bold' : ''}`}>
                                <BootstrapIcon name="calendar-event" className="me-2 d-lg-none" />{t('navEvents')}
                            </NavLink>
                            <NavLink to="/statistics" end onClick={closeNav}
                                     className={({isActive}) => `nav-link rounded px-3 ${isActive ? 'active bg-light text-primary fw-bold' : ''}`}>
                                <BootstrapIcon name="graph-up" className="me-2 d-lg-none" />{t('navStatistics')}
                            </NavLink>
                            {userLink && (
                                <NavLink to={`/users/${userLink}`} end onClick={closeNav}
                                         className={({isActive}) => `nav-link rounded px-3 ${isActive ? 'active bg-light text-primary fw-bold' : ''}`}>
                                    <BootstrapIcon name="person" className="me-2 d-lg-none" />{t('navProfile')}
                                </NavLink>
                            )}
                        </Nav>

                        <Stack direction="horizontal" gap={2} className="align-items-center mt-3 mt-lg-0 pt-3 pt-lg-0">
                            <Button
                                variant="danger"
                                size="sm"
                                className="w-100 w-lg-auto text-start text-lg-center"
                                onClick={() => {
                                    closeNav();
                                    logout();
                                }}
                                title={t('logout')}
                            >
                                <BootstrapIcon name="box-arrow-right" />
                                <Navbar.Text className="d-inline-block d-lg-none ms-2 mb-0">{t('logout')}</Navbar.Text>
                            </Button>
                        </Stack>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            {children}
        </>
    );
};

export default AuthenticatedLayout;