import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {SignBody} from '../api/body/SignBody';

interface SignFormViewProps {
    formData: Partial<SignBody>;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    loading: boolean;
    fieldErrors: Record<string, string | string[]>;
    globalError: string | null;
}

export const SignFormView: React.FC<SignFormViewProps> = ({
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
                            <h2 className="text-center mb-4">{t('sign')}</h2>
                            <form onSubmit={onSubmit}>
                                {globalError && <div className="alert alert-danger">{globalError}</div>}
                                <div className="mb-3">
                                    <label className="form-label">{t('email')}</label>
                                    <input
                                        name="email"
                                        type="email"
                                        className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                    {fieldErrors.email &&
                                        <div className="invalid-feedback d-block">{fieldErrors.email}</div>}
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">{t('password')}</label>
                                    <input
                                        type="password"
                                        name="password"
                                        className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                                        value={formData.password}
                                        onChange={handleChange}
                                        minLength={8}
                                        maxLength={64}
                                        required
                                    />
                                    {fieldErrors.password &&
                                        <div className="invalid-feedback d-block">{fieldErrors.password}</div>}
                                </div>
                                <div className="mb-3 form-check">
                                    <input
                                        type="checkbox"
                                        name="rememberMe"
                                        className="form-check-input"
                                        id="rememberMe"
                                        checked={formData.rememberMe}
                                        onChange={handleChange}
                                    />
                                    <label className="form-check-label" htmlFor="rememberMe">{t('rememberMe')}</label>
                                </div>
                                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                                    {loading ? t('sending') : t('submitSign')}
                                </button>
                            </form>
                            <div className="mt-3 text-center">
                                <a href="/register" className="btn btn-link">{t('register')}</a>
                                <span className="mx-2">|</span>
                                <a href="/password-reset" className="btn btn-link">{t('passwordReset')}</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};