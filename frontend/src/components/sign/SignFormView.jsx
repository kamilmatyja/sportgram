import { useTranslation } from '../../context/TranslationContext';

export const SignFormView = ({ formData, handleChange, onSubmit, loading, fieldErrors, globalError }) => {
    const { t } = useTranslation();

    return (
    <div className="container mt-5">
        <div className="row justify-content-center">
            <div className="col-12 col-md-8 col-lg-5">
                <div className="card shadow-sm">
                    <div className="card-body p-4">
                        <h2 className="text-center mb-4">{t('login')}</h2>
                        <form onSubmit={onSubmit}>
                            {globalError && <div className="alert alert-danger">{globalError}</div>}

                            <div className="mb-3">
                                <label className="form-label">{t('email')}</label>
                                <input name="email" className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                                       value={formData.email ?? ''} onChange={handleChange} required/>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">{t('password')}</label>
                                <input type="password" name="password" className="form-control"
                                       value={formData.password ?? ''} onChange={handleChange} minLength="8" maxLength="64" required/>
                            </div>
                            <div className="mb-3 form-check">
                                <input type="checkbox" name="rememberMe" className="form-check-input"
                                       id="rememberMe" checked={formData.rememberMe ?? false} onChange={handleChange} />
                                <label className="form-check-label" htmlFor="rememberMe">{t('rememberMe')}</label>
                            </div>
                            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                                {loading ? t('sending') : t('submitSign')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
};