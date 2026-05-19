import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {RegisterProvider} from '../api/providers/RegisterProvider';
import {UserProvider} from '../api/providers/UserProvider';
import {RegisterFormView} from '../components/RegisterFormView';
import {VerificationFormView} from '../components/VerificationFormView';
import {RegisterBody} from '../api/body/RegisterBody.ts';
import {CodeBody} from '../api/body/CodeBody.ts';
import {EmailBody} from '../api/body/EmailBody.ts';
import {SignProvider} from '../api/providers/SignProvider';
import {SignBody} from '../api/body/SignBody.ts';
import {PasswordResetProvider} from '../api/providers/PasswordResetProvider';
import {createFormHandler} from '../utils/formHandler';

export default function Register() {
    const step = Number(sessionStorage.getItem('step')) || 1;
    const registerId = sessionStorage.getItem('register_id') || null;

    const [registerFormData, setRegisterFormData] = useState({
        firstName: '', lastName: '', email: '', password: '',
        phone: '' as string | number, birthAt: '', gender: 1, country: 1, roles: [1]
    });
    const [codeFormData, setCodeFormData] = useState({code: '' as string | number});

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

        const dto = new RegisterBody(
            registerFormData.birthAt,
            registerFormData.firstName,
            registerFormData.lastName,
            registerFormData.gender,
            registerFormData.phone,
            registerFormData.email,
            registerFormData.password,
            registerFormData.country,
            registerFormData.roles
        );

        try {
            await userProviders.createNano(dto);

            const emailDto = new EmailBody(registerFormData.email);
            const res = await registerProvider.register(emailDto);

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

        const dto = new CodeBody(codeFormData.code);
        try {
            await registerProvider.confirm(registerId, dto);

            const email = sessionStorage.getItem('email') || '';
            const password = sessionStorage.getItem('password') || '';

            if (password) {
                const signDto = new SignBody(email, password, false);
                const res = await signProvider.sign(signDto);

                sessionStorage.setItem('step', '2');
                sessionStorage.setItem('sign_id', res.id);
                sessionStorage.removeItem('register_id');

                navigate('/sign');
            } else {
                const emailDto = new EmailBody(email);
                const res = await passwordResetProvider.passwordReset(emailDto);

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

    return <RegisterFormView
        formData={registerFormData}
        handleChange={createFormHandler(setRegisterFormData)}
        onSubmit={handleRegisterSubmit}
        loading={loading}
        fieldErrors={fieldErrors}
        globalError={globalError}
    />;
}