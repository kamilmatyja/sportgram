import React from 'react';
import { Link } from 'react-router-dom';
import {useTranslation} from '../context/TranslationContext';

const GuestHome: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="container mt-5 text-center">
            <h1>{t('guestHome.title')}</h1>
            <p className="text-muted">{t('guestHome.subtitle')}</p>
            <div className="mt-4 gap-3 d-flex justify-content-center">
                <Link to="/sign" className="btn btn-primary">{t('guestHome.login')}</Link>
                <Link to="/register" className="btn btn-outline-primary">{t('guestHome.register')}</Link>
            </div>
        </div>
    );
};

export default GuestHome;
