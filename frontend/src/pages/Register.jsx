import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const countryOptions = [
    { value: 1, label: 'Albania' },
    { value: 2, label: 'Andorra' },
    { value: 3, label: 'Austria' },
    { value: 4, label: 'Belarus' },
    { value: 5, label: 'Belgium' },
    { value: 6, label: 'Bosnia and Herzegovina' },
    { value: 7, label: 'Bulgaria' },
    { value: 8, label: 'Croatia' },
    { value: 9, label: 'Cyprus' },
    { value: 10, label: 'Czech Republic' },
    { value: 11, label: 'Denmark' },
    { value: 12, label: 'Estonia' },
    { value: 13, label: 'Finland' },
    { value: 14, label: 'France' },
    { value: 15, label: 'Georgia' },
    { value: 16, label: 'Germany' },
    { value: 17, label: 'Greece' },
    { value: 18, label: 'Hungary' },
    { value: 19, label: 'Iceland' },
    { value: 20, label: 'Ireland' },
    { value: 21, label: 'Italy' },
    { value: 22, label: 'Kazakhstan' },
    { value: 23, label: 'Kosovo' },
    { value: 24, label: 'Latvia' },
    { value: 25, label: 'Liechtenstein' },
    { value: 26, label: 'Lithuania' },
    { value: 27, label: 'Luxembourg' },
    { value: 28, label: 'Malta' },
    { value: 29, label: 'Moldova' },
    { value: 30, label: 'Monaco' },
    { value: 31, label: 'Montenegro' },
    { value: 32, label: 'Netherlands' },
    { value: 33, label: 'North Macedonia' },
    { value: 34, label: 'Norway' },
    { value: 35, label: 'Poland' },
    { value: 36, label: 'Portugal' },
    { value: 37, label: 'Romania' },
    { value: 38, label: 'Russia' },
    { value: 39, label: 'San Marino' },
    { value: 40, label: 'Serbia' },
    { value: 41, label: 'Slovakia' },
    { value: 42, label: 'Slovenia' },
    { value: 43, label: 'Spain' },
    { value: 44, label: 'Sweden' },
    { value: 45, label: 'Switzerland' },
    { value: 46, label: 'Turkey' },
    { value: 47, label: 'Ukraine' },
    { value: 48, label: 'United Kingdom' },
    { value: 49, label: 'Vatican City' },
];
const roleOptions = [
    { value: 1, label: 'Uczestnik' },
    { value: 2, label: 'Organizator' },
];
const genderOptions = [
    { value: 1, label: 'Mężczyzna' },
    { value: 2, label: 'Kobieta' },
];

export default function Register() {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [registerId, setRegisterId] = useState(null);
    const [loading, setLoading] = useState(false);

    const [globalError, setGlobalError] = useState('');
    const [resendSuccess, setResendSuccess] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        birthAt: '',
        gender: '',
        country: '',
        roles: [],
    });

    const [code, setCode] = useState('');

    useEffect(() => {
        const unconfirmedData = sessionStorage.getItem('unconfirmed');
        if (unconfirmedData) {
            const parsedData = JSON.parse(unconfirmedData);
            setFormData(prev => ({
                ...prev,
                email: parsedData.email,
                password: parsedData.password || ''
            }));
            sessionStorage.removeItem('unconfirmed');
            requestRegisterCode(parsedData.email);
            return;
        }

        const savedState = sessionStorage.getItem('register_state');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            setStep(parsedState.step);
            setRegisterId(parsedState.registerId);
            setFormData(parsedState.formData);
        }
    }, []);

    const requestRegisterCode = async (email) => {
        setLoading(true);
        setGlobalError('');
        try {
            const registerRes = await apiFetch('/api/registers', {
                method: 'POST',
                body: JSON.stringify({ email })
            });

            setRegisterId(registerRes.id);
            setStep(2);

            sessionStorage.setItem('register_state', JSON.stringify({
                step: 2,
                registerId: registerRes.id,
                formData: { ...formData, email }
            }));
        } catch (err) {
            if (err.error) {
                setGlobalError(err.error);
            } else {
                setGlobalError('Wystąpił błąd podczas żądania kodu.');
            }
            setStep(1);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        if (e.target.name === 'roles') {
            const selected = Array.from(e.target.selectedOptions, opt => opt.value);
            setFormData({ ...formData, roles: selected });
            setFieldErrors({ ...fieldErrors, roles: null });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
            setFieldErrors({ ...fieldErrors, [e.target.name]: null });
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        try {
            await apiFetch('/api/user-nano', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    gender: parseInt(formData.gender),
                    phone: parseInt(formData.phone),
                    country: parseInt(formData.country),
                    roles: formData.roles.map(Number),
                })
            });

            await requestRegisterCode(formData.email);
        } catch (err) {
            if (err.errors) {
                setFieldErrors(err.errors);
            } else if (err.error) {
                setGlobalError(err.error);
            } else {
                setGlobalError('Wystąpił nieoczekiwany błąd.');
            }
            setLoading(false);
        }
    };

    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setResendSuccess(false);

        try {
            await apiFetch(`/api/registers/${registerId}/confirm`, {
                method: 'PATCH',
                body: JSON.stringify({code: parseInt(code)})
            });

            sessionStorage.removeItem('register_state');
            sessionStorage.setItem('auto_sign', JSON.stringify({
                email: formData.email,
                password: formData.password
            }));

            navigate('/sign');
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
            await apiFetch(`/api/registers/${registerId}/resend`, { method: 'POST' });
            setResendSuccess(true);
        } catch (err) {
            setGlobalError(err.error || 'Nie udało się wysłać kodu ponownie.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        sessionStorage.removeItem('register_state');
        setStep(1);
        setRegisterId(null);
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
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card shadow-sm">
                        <div className="card-body p-4">
                            <h2 className="text-center mb-4">Rejestracja</h2>

                            {globalError && (
                                <div className="alert alert-danger" role="alert">
                                    {globalError}
                                </div>
                            )}

                            {resendSuccess && (
                                <div className="alert alert-success" role="alert">
                                    Kod został pomyślnie wysłany ponownie na Twój adres email.
                                </div>
                            )}

                            {step === 1 && (
                                <form onSubmit={handleRegisterSubmit}>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Imię</label>
                                            <input type="text" name="firstName"
                                                   className={`form-control ${fieldErrors.firstName ? 'is-invalid' : ''}`}
                                                   value={formData.firstName} onChange={handleChange} required/>
                                            {renderFieldError('firstName')}
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Nazwisko</label>
                                            <input type="text" name="lastName"
                                                   className={`form-control ${fieldErrors.lastName ? 'is-invalid' : ''}`}
                                                   value={formData.lastName} onChange={handleChange} required/>
                                            {renderFieldError('lastName')}
                                        </div>
                                    </div>

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

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Telefon</label>
                                            <input type="number" name="phone"
                                                   className={`form-control ${fieldErrors.phone ? 'is-invalid' : ''}`}
                                                   value={formData.phone} onChange={handleChange} required/>
                                            {renderFieldError('phone')}
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Data urodzenia</label>
                                            <input type="date" name="birthAt"
                                                   className={`form-control ${fieldErrors.birthAt ? 'is-invalid' : ''}`}
                                                   value={formData.birthAt} onChange={handleChange} required/>
                                            {renderFieldError('birthAt')}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label">Płeć</label>
                                        <select name="gender" className="form-select" value={formData.gender} onChange={handleChange} required>
                                            <option value="">Wybierz płeć...</option>
                                            {genderOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        {renderFieldError('gender')}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Kraj</label>
                                        <select name="country" className={`form-select ${fieldErrors.country ? 'is-invalid' : ''}`} value={formData.country} onChange={handleChange} required>
                                            <option value="">Wybierz kraj...</option>
                                            {countryOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        {renderFieldError('country')}
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label">Role</label>
                                        <select name="roles" multiple className={`form-select ${fieldErrors.roles ? 'is-invalid' : ''}`} value={formData.roles} onChange={handleChange} required>
                                            {roleOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        {renderFieldError('roles')}
                                    </div>

                                    <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                                        {loading ? 'Przetwarzanie...' : 'Zarejestruj się'}
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
                                        <input type="number" className="form-control text-center fs-4 tracking-widest"
                                               value={code} onChange={(e) => setCode(e.target.value)} min="100000"
                                               max="999999" required autoFocus/>
                                    </div>
                                    <div className="d-flex flex-column gap-2">
                                        <button type="submit" className="btn btn-success py-2" disabled={loading}>
                                            {loading ? 'Sprawdzanie...' : 'Potwierdź konto'}
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
                            <Link to="/sign" className="text-decoration-none">Masz już konto? Zaloguj się</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}