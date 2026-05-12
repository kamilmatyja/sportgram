import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { SignService } from '../api/SignService';
import { SignDto } from '../api/dto/SignDto';
import { SignFormView } from '../components/SignFormView';
import { VerificationFormView } from '../components/VerificationFormView';
import { CodeDto } from '../api/dto/CodeDto';
import {RegisterService} from '../api/RegisterService';
import {EmailDto} from '../api/dto/EmailDto';

export default function Sign() {
    const step = Number(sessionStorage.getItem('step')) || 1;
    const signId = sessionStorage.getItem('sign_id') || null;
    const [signFormData, setSignFormData] = useState({email: '', password: '', rememberMe: false});
    const [codeFormData, setCodeFormData] = useState({ code: '' });

    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [resendSuccess, setResendSuccess] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();
    const signService = new SignService();
    const registerService = new RegisterService();

    const handleSignSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        const dto = new SignDto(signFormData.email, signFormData.password, signFormData.rememberMe);
        try {
            const res = await signService.sign(dto);

            sessionStorage.setItem('step', '2');
            sessionStorage.setItem('sign_id', res.id);
            sessionStorage.setItem('email', signFormData.email);
            sessionStorage.setItem('password', signFormData.password);
            sessionStorage.removeItem('token');
        } catch (err) {
            if (err.errors) setFieldErrors(err.errors);
            else if (err.error === 'User account is not confirmed.') {
                try {
                    const emailDto = new EmailDto(signFormData.email);
                    const res = await registerService.register(emailDto);

                    sessionStorage.setItem('step', '2');
                    sessionStorage.setItem('register_id', res.id);
                    sessionStorage.setItem('email', signFormData.email);
                    sessionStorage.setItem('password', signFormData.password);
                    sessionStorage.removeItem('sign_id');

                    navigate('/register');
                } catch (err) {
                    if (err.errors) setFieldErrors(err.errors);
                    else setGlobalError(err.error);
                }
            }
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
            const res = await signService.confirm(signId, dto)

            sessionStorage.setItem('token', res.token);
            sessionStorage.removeItem('step');
            sessionStorage.removeItem('sign_id');
            sessionStorage.removeItem('email');

            login(res.token, signId, signFormData.rememberMe);

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

    const clearSessionDataAndGoToStep1 = () => {
        sessionStorage.setItem('step', '1');
        sessionStorage.removeItem('sign_id');
        sessionStorage.removeItem('email');
        sessionStorage.removeItem('password');
        sessionStorage.removeItem('token');

        navigate('/sign');
    };

    const createHandler = (setter) => (e) => {
        const { name, value, type, checked } = e.target;
        setter(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    if (step === 2) {
        return <VerificationFormView
            formData={codeFormData}
            handleChange={createHandler(setCodeFormData)}
            onSubmit={handleCodeSubmit}
            loading={loading}
            fieldErrors={fieldErrors}
            globalError={globalError}
            onCancel={clearSessionDataAndGoToStep1}
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