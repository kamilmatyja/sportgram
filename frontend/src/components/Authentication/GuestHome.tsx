import React from 'react';
import { Container, Card, Stack } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { useTranslation } from '../../context/TranslationContext';

const GuestHome: React.FC = () => {
    const { t } = useTranslation();
    return (
        <Container className="py-5 text-center">
            <Card className="bg-transparent border-0">
                <Card.Body>
                    <Stack gap={4} className="align-items-center">
                        <Stack as="h1" className="display-4 fw-bold">
                            {t('guestHomeTitle')}
                        </Stack>
                        <Card.Text className="text-muted fs-5">{t('guestHomeSubtitle')}</Card.Text>
                        <Stack direction="horizontal" gap={3} className="justify-content-center">
                            <Link to="/sign" className="btn btn-primary px-4">
                                {t('guestHomeLogin')}
                            </Link>
                            <Link to="/register" className="btn btn-outline-primary px-4">
                                {t('guestHomeRegister')}
                            </Link>
                        </Stack>
                    </Stack>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default GuestHome;
