
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { SignService } from '../api/SignService';
import { SignDto } from '../api/dto/SignDto';
import { SignFormView } from '../components/SignFormView';
import { VerificationFormView } from '../components/VerificationFormView';
import { CodeDto } from '../api/dto/CodeDto.js';


export default function Sign() {
    // Inicjalizacja tylko wymaganych danych
    const [step, setStep] = useState(() => Number(sessionStorage.getItem('step')) || 1);
    const [signId, setSignId] = useState(() => sessionStorage.getItem('sign_id') || null);
    const [signFormData, setSignFormData] = useState(() => ({
        email: sessionStorage.getItem('email') || '',
        password: sessionStorage.getItem('password') || '',
        rememberMe: false
    }));
    const [codeFormData, setCodeFormData] = useState({ code: '' });

    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [resendSuccess, setResendSuccess] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();
    const signService = new SignService();


    const handleSignSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        const dto = new SignDto(signFormData.email, signFormData.password, signFormData.rememberMe);
        try {
            const res = await signService.sign(dto);
            setSignId(res.id);
            setStep(2);
            // Zapisz tylko wymagane dane do sessionStorage
            sessionStorage.setItem('step', '2');
            sessionStorage.setItem('sign_id', res.id);
            sessionStorage.setItem('email', signFormData.email);
            sessionStorage.setItem('password', signFormData.password);
            // Usuń niepotrzebne dane
            sessionStorage.removeItem('sign_data');
            sessionStorage.removeItem('sign_code');
            sessionStorage.removeItem('token');
        } catch (err) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };


    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        const dto = new CodeDto(codeFormData.code);
        try {
            const res = await signService.confirm(signId, dto);
            login(res.token, signId, signFormData.rememberMe);
            // Po udanym 2. kroku: zapisz token, usuń step i password
            sessionStorage.setItem('token', res.token);
            sessionStorage.removeItem('step');
            sessionStorage.removeItem('password');
            navigate('/');
        } catch (err) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };


    const handleResend = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        try {
            await signService.resend(signId);
            setResendSuccess(true);
        } catch (err) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };


    const createHandler = (setter) => (e) => {
        const { name, value, type, checked } = e.target;
        setter(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Funkcja do czyszczenia danych logowania z sessionStorage
    const clearSessionData = () => {
        sessionStorage.removeItem('sign_id');
        sessionStorage.removeItem('email');
        sessionStorage.removeItem('password');
        sessionStorage.removeItem('step');
        sessionStorage.removeItem('token');
    };

    if (step === 2) {
        return <VerificationFormView
            formData={codeFormData}
            handleChange={createHandler(setCodeFormData)}
            onSubmit={handleCodeSubmit}
            loading={loading}
            onCancel={() => {
                setStep(1);
                setSignId(null);
                setSignFormData({ email: '', password: '', rememberMe: false });
                setCodeFormData({ code: '' });
                clearSessionData();
            }}
            fieldErrors={fieldErrors}
            globalError={globalError}
            onResend={handleResend}
            resendSuccess={resendSuccess}
        />;
    }

    return <SignFormView
        formData={signFormData}
        handleChange={createHandler(setSignFormData)}
        onSubmit={handleSignSubmit}
        loading={loading}
        fieldErrors={fieldErrors}
        globalError={globalError}
    />;
}