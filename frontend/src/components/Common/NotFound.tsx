import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { Container, Stack } from 'react-bootstrap';

const NotFound: React.FC = () => {
    const { t } = useTranslation();
    return (
        <Container className="py-5">
            <Stack className="align-items-center text-center">
                <h1 className="display-1 fw-bold text-muted">404</h1>
                <p className="fs-4">{t('notFound')}</p>
            </Stack>
        </Container>
    );
};

export default NotFound;