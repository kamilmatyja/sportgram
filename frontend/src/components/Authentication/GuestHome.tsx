import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../context/TranslationContext';
import { Container, Card, Stack } from 'react-bootstrap';

const GuestHome: React.FC = () => {
    const { t } = useTranslation();
    return (
        <Container className="py-5 text-center">
            <Card border="0" className="bg-transparent">
                <Card.Body>
                    <Stack gap={3} className="align-items-center">
                        <h1>{t('guestHomeTitle')}</h1>
                        <p className="text-muted">{t('guestHomeSubtitle')}</p>
                        <Stack direction="horizontal" gap={3} className="justify-content-center">
                            <Link to="/sign" className="btn btn-primary">{t('guestHomeLogin')}</Link>
                            <Link to="/register" className="btn btn-outline-primary">{t('guestHomeRegister')}</Link>
                        </Stack>
                    </Stack>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default GuestHome;