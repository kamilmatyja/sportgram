import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {Container} from 'react-bootstrap';

const NotFound: React.FC = () => {
    const {t} = useTranslation();
    return (
        <Container as="h1" className="text-center mt-5">
            404 - {t('notFound')}
        </Container>
    );
};

export default NotFound;