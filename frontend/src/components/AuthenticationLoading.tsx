import React from 'react';
import {useTranslation} from '../context/TranslationContext';

const AuthenticationLoading: React.FC = () => {
    const {t} = useTranslation();
    return (
        <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t('auth.loading')}</span>
            </div>
        </div>
    );
};

export default AuthenticationLoading;
