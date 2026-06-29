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
    const {currentUser} = useAppAccess();
    const [userLink, setUserLink] = useState<string | null>(null);

    useEffect(() => {
        if (currentUser?.link) setUserLink(currentUser.link);
    }, [currentUser]);

    const closeNav = () => setIsNavOpen(false);

    return (
        <>
            <Navbar expanded={isNavOpen} onToggle={setIsNavOpen} expand="lg" bg="white" sticky="top" className="shadow-sm border-bottom mb-4">
                <Container>
                    <Navbar.Brand as={NavLink} to="/" className="fw-bold text-primary" onClick={closeNav}>
                        {t('brand.sportgram')}
                    </Navbar.Brand>

                    <Navbar.Toggle />

                    <Navbar.Collapse>
                        <Nav className="me-auto gap-1 my-2 my-lg-0">
                            <Nav.Link as={NavLink} to="/" end onClick={closeNav}>{t('navHome')}</Nav.Link>
                            <Nav.Link as={NavLink} to="/users" end onClick={closeNav}>{t('navUsers')}</Nav.Link>
                            <Nav.Link as={NavLink} to="/pages" end onClick={closeNav}>{t('navPages')}</Nav.Link>
                            <Nav.Link as={NavLink} to="/events" end onClick={closeNav}>{t('navEvents')}</Nav.Link>
                            <Nav.Link as={NavLink} to="/statistics" end onClick={closeNav}>{t('navStatistics')}</Nav.Link>
                            {userLink && (
                                <Nav.Link as={NavLink} to={`/users/${userLink}`} end onClick={closeNav}>{t('navProfile')}</Nav.Link>
                            )}
                        </Nav>

                        <Stack direction="horizontal" gap={2}>
                            <Button variant="danger" size="sm" className="w-100" onClick={() => { closeNav(); logout(); }}>
                                <BootstrapIcon name="box-arrow-right" />
                                <span className="ms-2 d-lg-none">{t('logout')}</span>
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