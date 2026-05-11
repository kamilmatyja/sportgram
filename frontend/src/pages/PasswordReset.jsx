import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';

export default function PasswordReset() {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [resetId, setResetId] = useState(null);
    const [loading, setLoading] = useState(false);

    const [globalError, setGlobalError] = useState('');
    const [resendSuccess, setResendSuccess] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        code: ''
    });

    useEffect(() => {
        const savedState = sessionStorage.getItem('sportgram_reset_state');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            setStep(parsedState.step);
            setResetId(parsedState.resetId);
            setFormData(parsedState.formData);
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setFieldErrors({ ...fieldErrors, [e.target.name]: null });
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        try {
            const res = await apiFetch('/api/password-resets', {
                method: 'POST',
                body: JSON.stringify({ email: formData.email })
            });

            setResetId(res.id);
            setStep(2);

            sessionStorage.setItem('sportgram_reset_state', JSON.stringify({
                step: 2,
                resetId: res.id,
                formData: { email: formData.email, password: '', code: '' }
            }));

        } catch (err) {
            if (err.error === 'User account is not confirmed.') {
                sessionStorage.setItem('sportgram_unconfirmed', JSON.stringify({ email: formData.email }));
                navigate('/register');
            } else if (err.errors) {
                setFieldErrors(err.errors);
            } else if (err.error) {
                setGlobalError(err.error);
            } else {
                setGlobalError('Wystąpił nieoczekiwany błąd.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});
        setResendSuccess(false);

        try {
            await apiFetch(`/api/password-resets/${resetId}/confirm`, {
                method: 'PATCH',
                body: JSON.stringify({
                    code: parseInt(formData.code),
                    password: formData.password
                })
            });

            sessionStorage.removeItem('sportgram_reset_state');
            sessionStorage.setItem('sportgram_auto_sign', JSON.stringify({
                email: formData.email,
                password: formData.password
            }));

            navigate('/sign');

        } catch (err) {
            if (err.errors) {
                setFieldErrors(err.errors);
            } else if (err.error) {
                setGlobalError(err.error);
            } else {
                setGlobalError('Błędny kod lub hasło.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setLoading(true);
        setGlobalError('');
        setResendSuccess(false);

        try {
            await apiFetch(`/api/password-resets/${resetId}/resend`, { method: 'POST' });
            setResendSuccess(true);
        } catch (err) {
            setGlobalError(err.error || 'Nie udało się wysłać kodu ponownie.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        sessionStorage.removeItem('sportgram_reset_state');
        setStep(1);
        setResetId(null);
        setFormData({ email: formData.email, password: '', code: '' });
        setGlobalError('');
        setResendSuccess(false);
        setFieldErrors({});
    };

    const renderFieldError = (fieldName) => {
        if (!fieldErrors[fieldName]) return null;
        return <div className="invalid-feedback d-block">{fieldErrors[fieldName][0]}</div>;
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-5">
                    <div className="card shadow-sm">
                        <div className="card-body p-4">
                            <h2 className="text-center mb-4">Resetowanie hasła</h2>

                            {globalError && (
                                <div className="alert alert-danger" role="alert">
                                    {globalError}
                                </div>
                            )}

                            {resendSuccess && (
                                <div className="alert alert-success" role="alert">
                                    Kod resetowania hasła został wysłany ponownie.
                                </div>
                            )}

                            {step === 1 && (
                                <form onSubmit={handleEmailSubmit}>
                                    <div className="mb-4">
                                        <label className="form-label">Email</label>
                                        <input type="email" name="email"
                                               className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                                               value={formData.email} onChange={handleChange} required/>
                                        {renderFieldError('email')}
                                    </div>

                                    <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                                        {loading ? 'Wysyłanie...' : 'Wyślij kod'}
                                    </button>
                                </form>
                            )}

                            {step === 2 && (
                                <form onSubmit={handleCodeSubmit}>
                                    <div className="alert alert-info">
                                        Na Twój adres email został wysłany 6-cyfrowy kod, wpisz go poniżej.
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Kod</label>
                                        <input type="number" name="code"
                                               className={`form-control text-center fs-4 tracking-widest ${fieldErrors.code ? 'is-invalid' : ''}`}
                                               value={formData.code} onChange={handleChange} min="100000"
                                               max="999999" required autoFocus/>
                                        {renderFieldError('code')}
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label">Nowe hasło</label>
                                        <input type="password" name="password"
                                               className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                                               value={formData.password} onChange={handleChange} minLength={8}
                                               required/>
                                        {renderFieldError('password')}
                                    </div>
                                    <div className="d-flex flex-column gap-2">
                                        <button type="submit" className="btn btn-success py-2" disabled={loading}>
                                            {loading ? 'Przetwarzanie...' : 'Zmień hasło'}
                                        </button>
                                        <button type="button" className="btn btn-outline-secondary py-2" onClick={handleResendCode} disabled={loading}>
                                            Wyślij kod ponownie
                                        </button>
                                        <button type="button" className="btn btn-link text-muted mt-2" onClick={handleCancel} disabled={loading}>
                                            Anuluj i wróć
                                        </button>
                                    </div>
                                </form>
                            )}

                        </div>
                    </div>
                    {step === 1 && (
                        <div className="text-center mt-3 d-flex flex-column gap-2">
                            <Link to="/sign" className="text-decoration-none">Pamiętasz hasło? Zaloguj się</Link>
                            <Link to="/register" className="text-decoration-none text-muted">Nie masz konta? Zarejestruj się</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}