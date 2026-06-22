import React from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from '../../context/TranslationContext';
import {Container, Card, Stack} from 'react-bootstrap';

const GuestHome: React.FC = () => {
    const {t} = useTranslation();
    return (
        <Container className="mt-5 text-center">
            <Card className="border-0 bg-transparent">
                <Card.Body className="p-0">
                    <Card.Title as="h1">{t('guestHomeTitle')}</Card.Title>
                    <Card.Text className="text-muted">{t('guestHomeSubtitle')}</Card.Text>
                    <Stack direction="horizontal" gap={3} className="mt-4 justify-content-center">
                        <Link to="/sign" className="btn btn-primary">{t('guestHomeLogin')}</Link>
                        <Link to="/register" className="btn btn-outline-primary">{t('guestHomeRegister')}</Link>
                    </Stack>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default GuestHome;