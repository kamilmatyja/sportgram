import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {Spinner, Container} from 'react-bootstrap';

const AuthenticationLoading: React.FC = () => {
    const {t} = useTranslation();
    return (
        <Container fluid className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
            <Spinner animation="border" variant="primary" role="status" aria-label={t('auth.loading')} />
        </Container>
    );
};

export default AuthenticationLoading;