import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { Spinner, Container, Stack } from 'react-bootstrap';

const AuthenticationLoading: React.FC = () => {
    const { t } = useTranslation();
    return (
        <Container fluid style={{ height: '100vh' }}>
            <Stack className="h-100">
                <Spinner animation="border" variant="primary" role="status" />
                <span className="mt-2">{t('auth.loading')}</span>
            </Stack>
        </Container>
    );
};

export default AuthenticationLoading;