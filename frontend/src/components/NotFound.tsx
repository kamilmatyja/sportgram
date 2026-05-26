import React from 'react';
import { useTranslation } from '../context/TranslationContext';

const NotFound: React.FC = () => {
    const { t } = useTranslation();
    return (
        <h1 className="text-center mt-5">
            404 - {t('notFound')}
        </h1>
    );
};

export default NotFound;


