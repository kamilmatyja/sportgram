import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {EmailBody} from '../api/body/EmailBody';

interface PasswordResetFormViewProps {
    formData: Partial<EmailBody>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    loading: boolean;
    fieldErrors: Record<string, string | string[]>;
    globalError: string;
}

export const PasswordResetFormView: React.FC<PasswordResetFormViewProps> = ({
                                                                                formData,
                                                                                handleChange,
                                                                                onSubmit,
                                                                                loading,
                                                                                fieldErrors,
                                                                                globalError
                                                                            }) => {
    const {t} = useTranslation();

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-5">
                    <div className="card shadow-sm">
                        <div className="card-body p-4">
                            <h2 className="text-center mb-4">{t('passwordReset')}</h2>
                            <form onSubmit={onSubmit}>
                                {globalError && <div className="alert alert-danger">{globalError}</div>}
                                <div className="mb-3">
                                    <label className="form-label">{t('email')}</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                    {fieldErrors.email &&
                                        <div className="invalid-feedback d-block">{fieldErrors.email}</div>}
                                </div>
                                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                                    {loading ? t('sending') : t('submitPasswordReset')}
                                </button>
                            </form>
                            <div className="mt-3 text-center">
                                <a href="/sign" className="btn btn-link">{t('sign')}</a>
                                <span className="mx-2">|</span>
                                <a href="/register" className="btn btn-link">{t('register')}</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};