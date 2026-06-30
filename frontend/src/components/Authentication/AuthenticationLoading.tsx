import React from 'react';
import { Spinner, Container, Stack } from 'react-bootstrap';

import { useTranslation } from '../../context/TranslationContext';

const AuthenticationLoading: React.FC = () => {
    const { t } = useTranslation();
    return (
        <Container fluid className="vh-100">
            <Stack gap={2} className="h-100 align-items-center justify-content-center">
                <Spinner animation="border" variant="primary" role="status" />
                <Stack as="span">{t('auth.loading')}</Stack>
            </Stack>
        </Container>
    );
};

export default AuthenticationLoading;
