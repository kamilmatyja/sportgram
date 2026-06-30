import React from 'react';
import { Container, Stack } from 'react-bootstrap';

import { useTranslation } from '../../context/TranslationContext';

const NotFound: React.FC = () => {
    const { t } = useTranslation();
    return (
        <Container className="py-5 text-center">
            <Stack gap={2} className="align-items-center">
                <Stack as="h1" className="display-1 fw-bold text-muted">
                    {t('notFound.title')}
                </Stack>
                <Stack as="p" className="fs-4">
                    {t('notFound')}
                </Stack>
            </Stack>
        </Container>
    );
};

export default NotFound;
