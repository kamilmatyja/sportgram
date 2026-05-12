
import { useTranslation } from '../context/TranslationContext';

export const VerificationView = ({ formData,
                                         handleChange,
                                         onSubmit,
                                         loading,
                                         fieldErrors,
                                         globalError,
                                         onCancel,
                                         onResend,
                                         resendSuccess }) => {
    const { t } = useTranslation();

    return (
    <div className="container mt-5">
        <div className="row justify-content-center">
            <div className="col-12 col-md-8 col-lg-5">
                <div className="card shadow-sm">
                    <div className="card-body p-4">
                        <h2 className="text-center mb-4">{t('verify')}</h2>
                        <form onSubmit={onSubmit}>
                            {globalError && <div className="alert alert-danger">{globalError}</div>}
                            {resendSuccess && <div className="alert alert-success">{t('resendSuccess')}</div>}

                            <div className="mb-3">
                                <label className="form-label">{t('verificationCode')}</label>
                                <input
                                    type="number"
                                    name="code"
                                    className={`form-control text-center fs-4 ${fieldErrors.code ? 'is-invalid' : ''}`}
                                    value={formData.code}
                                    onChange={handleChange}
                                    min="100000"
                                    max="999999"
                                    required
                                    autoFocus
                                />
                                {fieldErrors.code && <div className="invalid-feedback">{fieldErrors.code[0]}</div>}
                            </div>

                            <div className="d-flex flex-column gap-2">
                                <button type="submit" className="btn btn-success py-2" disabled={loading}>
                                    {loading ? t('sending') : t('submitVerify')}
                                </button>
                                <button type="button" className="btn btn-outline-secondary py-2" onClick={onResend} disabled={loading}>
                                    {t('resend')}
                                </button>
                                <button type="button" className="btn btn-link text-muted mt-2" onClick={onCancel}>
                                    {t('cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
};