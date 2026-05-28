import React from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from '../../context/TranslationContext';

const GuestHome: React.FC = () => {
    const {t} = useTranslation();
    return (
        <div className="container mt-5 text-center">
            <h1>{t('guestHomeTitle')}</h1>
            <p className="text-muted">{t('guestHomeSubtitle')}</p>
            <div className="mt-4 gap-3 d-flex justify-content-center">
                <Link to="/sign" className="btn btn-primary">{t('guestHomeLogin')}</Link>
                <Link to="/register" className="btn btn-outline-primary">{t('guestHomeRegister')}</Link>
            </div>
        </div>
    );
};

export default GuestHome;
