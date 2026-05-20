import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {SignProvider} from '../api/providers/SignProvider';
import {RegisterProvider} from '../api/providers/RegisterProvider';
import {SignBody} from '../api/body/SignBody';
import {CodeBody} from '../api/body/CodeBody';
import {EmailBody} from '../api/body/EmailBody';
import {useAuth} from '../context/AuthContext';
import {createFormHandler} from '../utils/formHandler';

export function useSign() {
    const step = Number(sessionStorage.getItem('step')) || 1;
    const signId = sessionStorage.getItem('sign_id') || null;
    const [signFormData, setSignFormData] = useState(new SignBody('', '', false));
    const [codeFormData, setCodeFormData] = useState(new CodeBody(''));

    const [loading, setLoading] = useState<boolean>(false);
    const [globalError, setGlobalError] = useState<string>('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});
    const [resendSuccess, setResendSuccess] = useState<boolean>(false);

    const navigate = useNavigate();
    const {login} = useAuth();

    const signProvider = new SignProvider();
    const registerProvider = new RegisterProvider();

    const handleSignSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        try {
            const res = await signProvider.sign(signFormData);
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
                    const dto = new EmailBody(signFormData.email);
                    const res = await registerProvider.register(dto);
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

        try {
            const res = await signProvider.confirm(signId, codeFormData);
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

    const handleSignChange = createFormHandler(setSignFormData);
    const handleCodeChange = createFormHandler(setCodeFormData);

    return {
        step,
        signProps: {
            formData: signFormData,
            handleChange: handleSignChange,
            onSubmit: handleSignSubmit,
            loading,
            globalError,
            fieldErrors
        },
        verificationProps: {
            formData: codeFormData,
            handleChange: handleCodeChange,
            onSubmit: handleCodeSubmit,
            loading,
            globalError,
            fieldErrors,
            onCancel: clearSessionDataAndGoToStep1,
            onResend: handleResend,
            resendSuccess
        }
    };
}