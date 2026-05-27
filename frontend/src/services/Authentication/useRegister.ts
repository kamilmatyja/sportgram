import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {RegisterProvider} from '../../api/providers/RegisterProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {SignProvider} from '../../api/providers/SignProvider';
import {PasswordResetProvider} from '../../api/providers/PasswordResetProvider';
import {RegisterBody} from '../../api/body/RegisterBody';
import {CodeBody} from '../../api/body/CodeBody';
import {EmailBody} from '../../api/body/EmailBody';
import {SignBody} from '../../api/body/SignBody';
import {createFormHandler} from '../../utils/formHandler';

export function useRegister() {
    const step = Number(sessionStorage.getItem('step')) || 1;
    const registerId = sessionStorage.getItem('register_id') || null;
    const [registerFormData, setRegisterFormData] = useState(new RegisterBody('', '', '', 0, 0, '', '', '', []));
    const [codeFormData, setCodeFormData] = useState(new CodeBody(''));

    const [loading, setLoading] = useState<boolean>(false);
    const [globalError, setGlobalError] = useState<string>('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});
    const [resendSuccess, setResendSuccess] = useState<boolean>(false);

    const navigate = useNavigate();
    const registerProvider = new RegisterProvider();
    const userProviders = new UserProvider();
    const signProvider = new SignProvider();
    const passwordResetProvider = new PasswordResetProvider();

    const handleRegisterSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        try {
            await userProviders.createNano(registerFormData);
            const dto = new EmailBody(registerFormData.email);
            const res = await registerProvider.register(dto);

            sessionStorage.setItem('step', '2');
            sessionStorage.setItem('register_id', res.id);
            sessionStorage.setItem('email', registerFormData.email);
            sessionStorage.setItem('password', registerFormData.password);
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        if (!registerId) return;

        try {
            await registerProvider.confirm(registerId, codeFormData);

            const email = sessionStorage.getItem('email') || '';
            const password = sessionStorage.getItem('password') || '';

            if (password) {
                const dto = new SignBody(email, password, false);
                const res = await signProvider.sign(dto);

                sessionStorage.setItem('step', '2');
                sessionStorage.setItem('sign_id', res.id);
                sessionStorage.removeItem('register_id');
                navigate('/sign');
            } else {
                const dto = new EmailBody(email);
                const res = await passwordResetProvider.passwordReset(dto);

                sessionStorage.setItem('step', '2');
                sessionStorage.setItem('password_reset_id', res.id);
                sessionStorage.removeItem('register_id');
                navigate('/password-reset');
            }
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!registerId) return;
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});
        try {
            await registerProvider.resend(registerId);
            setResendSuccess(true);
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const clearSessionDataAndGoToStep1 = () => {
        sessionStorage.setItem('step', '1');
        sessionStorage.removeItem('register_id');
        sessionStorage.removeItem('email');
        sessionStorage.removeItem('password');
        navigate('/register');
    };

    const handleRegisterChange = createFormHandler(setRegisterFormData);
    const handleCodeChange = createFormHandler(setCodeFormData);

    return {
        step,
        registerProps: {
            formData: registerFormData,
            handleChange: handleRegisterChange,
            onSubmit: handleRegisterSubmit,
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