import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Sign() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [step, setStep] = useState(1);
    const [signId, setSignId] = useState(null);
    const [loading, setLoading] = useState(false);

    const [globalError, setGlobalError] = useState('');
    const [resendSuccess, setResendSuccess] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });

    const [code, setCode] = useState('');

    useEffect(() => {
        const autoSignData = sessionStorage.getItem('sportgram_auto_sign');
        if (autoSignData) {
            const parsedData = JSON.parse(autoSignData);
            setFormData(prev => ({ ...prev, email: parsedData.email, password: parsedData.password }));
            sessionStorage.removeItem('sportgram_auto_sign');
            doSignRequest(parsedData.email, parsedData.password);
            return;
        }

        const savedState = sessionStorage.getItem('sportgram_sign_state');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            setStep(parsedState.step);
            setSignId(parsedState.signId);
            setFormData(parsedState.formData);
        }
    }, []);

    const doSignRequest = async (email, password) => {
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        try {
            const signRes = await apiFetch('/api/signs', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            setSignId(signRes.id);
            setStep(2);

            sessionStorage.setItem('sportgram_sign_state', JSON.stringify({
                step: 2,
                signId: signRes.id,
                formData: { email, password, rememberMe: formData.rememberMe }
            }));

        } catch (err) {
            if (err.error === 'User account is not confirmed.') {
                sessionStorage.setItem('sportgram_unconfirmed', JSON.stringify({ email, password }));
                navigate('/register');
            } else if (err.errors) {
                setFieldErrors(err.errors);
                setStep(1);
            } else if (err.error) {
                setGlobalError(err.error);
                setStep(1);
            } else {
                setGlobalError('Wystąpił nieoczekiwany błąd.');
                setStep(1);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
        setFieldErrors({ ...fieldErrors, [e.target.name]: null });
    };

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        doSignRequest(formData.email, formData.password);
    };

    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setResendSuccess(false);

        try {
            const res = await apiFetch(`/api/signs/${signId}/confirm`, {
                method: 'PATCH',
                body: JSON.stringify({code: parseInt(code)})
            });

            sessionStorage.removeItem('sportgram_sign_state');

            login(res.token, signId, formData.rememberMe);

            navigate('/');

        } catch (err) {
            if (err.errors && err.errors.code) {
                setGlobalError(err.errors.code[0]);
            } else if (err.error) {
                setGlobalError(err.error);
            } else {
                setGlobalError('Błędny kod.');
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
            await apiFetch(`/api/signs/${signId}/resend`, { method: 'POST' });
            setResendSuccess(true);
        } catch (err) {
            setGlobalError(err.error || 'Nie udało się wysłać kodu ponownie.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        sessionStorage.removeItem('sportgram_sign_state');
        setStep(1);
        setSignId(null);
        setCode('');
        setGlobalError('');
        setResendSuccess(false);
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
                            <h2 className="text-center mb-4">Logowanie</h2>

                            {globalError && (
                                <div className="alert alert-danger" role="alert">
                                    {globalError}
                                </div>
                            )}

                            {resendSuccess && (
                                <div className="alert alert-success" role="alert">
                                    Kod logowania został pomyślnie wysłany ponownie.
                                </div>
                            )}

                            {step === 1 && (
                                <form onSubmit={handleLoginSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">Email</label>
                                        <input type="email" name="email"
                                               className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                                               value={formData.email} onChange={handleChange} required/>
                                        {renderFieldError('email')}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Hasło</label>
                                        <input type="password" name="password"
                                               className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                                               value={formData.password} onChange={handleChange} minLength={8}
                                               required/>
                                        {renderFieldError('password')}
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox" name="rememberMe" id="rememberMe" checked={formData.rememberMe} onChange={handleChange} />
                                            <label className="form-check-label" htmlFor="rememberMe">
                                                Zapamiętaj mnie
                                            </label>
                                        </div>
                                        <Link to="/password-reset" className="small text-decoration-none">Zapomniałeś hasła?</Link>
                                    </div>

                                    <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                                        {loading ? 'Logowanie...' : 'Zaloguj się'}
                                    </button>
                                </form>
                            )}

                            {step === 2 && (
                                <form onSubmit={handleCodeSubmit}>
                                    <div className="alert alert-info">
                                        Na Twój adres email został wysłany 6-cyfrowy kod logowania. Wpisz go poniżej.
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Kod logowania</label>
                                        <input type="number" className="form-control text-center fs-4 tracking-widest"
                                               value={code} onChange={(e) => setCode(e.target.value)} min="100000"
                                               max="999999" required autoFocus/>
                                    </div>
                                    <div className="d-flex flex-column gap-2">
                                        <button type="submit" className="btn btn-success py-2" disabled={loading}>
                                            {loading ? 'Weryfikacja...' : 'Zaloguj się'}
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
                        <div className="text-center mt-3">
                            <Link to="/register" className="text-decoration-none">Nie masz konta? Zarejestruj się</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}