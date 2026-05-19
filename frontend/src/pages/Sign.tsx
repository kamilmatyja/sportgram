import React, {useState} from 'react';
import {useAuth} from '../context/AuthContext';
import {useNavigate} from 'react-router-dom';
import {SignProvider} from '../api/providers/SignProvider';
import {SignDto} from '../api/dto/SignDto';
import {SignFormView} from '../components/SignFormView';
import {VerificationFormView} from '../components/VerificationFormView';
import {CodeDto} from '../api/dto/CodeDto';
import {RegisterProvider} from '../api/providers/RegisterProvider';
import {EmailDto} from '../api/dto/EmailDto';
import {createFormHandler} from '../utils/formHandler';

export default function Sign() {
    const step = Number(sessionStorage.getItem('step')) || 1;
    const signId = sessionStorage.getItem('sign_id') || null;

    const [signFormData, setSignFormData] = useState({email: '', password: '', rememberMe: false});
    const [codeFormData, setCodeFormData] = useState({code: '' as string | number});

    const [loading, setLoading] = useState<boolean>(false);
    const [globalError, setGlobalError] = useState<string>('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});
    const [resendSuccess, setResendSuccess] = useState<boolean>(false);

    const navigate = useNavigate();
    const { login } = useAuth();
    const signProvider = new SignProvider();
    const registerProvider = new RegisterProvider();

    const handleSignSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        const dto = new SignDto(signFormData.email, signFormData.password, signFormData.rememberMe);
        try {
            const res = await signProvider.sign(dto);

            sessionStorage.setItem('step', '2');
            sessionStorage.setItem('sign_id', res.id);
            sessionStorage.setItem('email', signFormData.email);
            sessionStorage.setItem('password', signFormData.password);
            sessionStorage.removeItem('token');
        } catch (err: any) {
            if (err.errors) {
                setFieldErrors(err.errors);
            } else if (err.error === 'User account is not confirmed.') {
                try {
                    const emailDto = new EmailDto(signFormData.email);
                    const res = await registerProvider.register(emailDto);

                    sessionStorage.setItem('step', '2');
                    sessionStorage.setItem('register_id', res.id);
                    sessionStorage.setItem('email', signFormData.email);
                    sessionStorage.setItem('password', signFormData.password);
                    sessionStorage.removeItem('sign_id');

                    navigate('/register');
                } catch (registerErr: any) {
                    if (registerErr.errors) setFieldErrors(registerErr.errors);
                    else setGlobalError(registerErr.error);
                }
            } else {
                setGlobalError(err.error);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        if (!signId) return;

        const dto = new CodeDto(codeFormData.code);
        try {
            const res = await signProvider.confirm(signId, dto);

            sessionStorage.setItem('token', res.token);
            sessionStorage.removeItem('step');
            sessionStorage.removeItem('sign_id');
            sessionStorage.removeItem('email');

            login(res.token, signId, signFormData.rememberMe);

            navigate('/');
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!signId) return;

        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        try {
            await signProvider.resend(signId);
            setResendSuccess(true);
        } catch (err: any) {
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

    if (step === 2) {
        return <VerificationFormView
            formData={codeFormData}
            handleChange={createFormHandler(setCodeFormData)}
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
        handleChange={createFormHandler(setSignFormData)}
        onSubmit={handleSignSubmit}
        loading={loading}
        fieldErrors={fieldErrors}
        globalError={globalError}
    />;
}