import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {PasswordResetProvider} from '../api/providers/PasswordResetProvider';
import {PasswordResetBody} from '../api/body/PasswordResetBody.ts';
import {PasswordResetFormView} from '../components/PasswordResetFormView';
import {PasswordResetVerificationFormView} from '../components/PasswordResetVerificationFormView';
import {EmailBody} from '../api/body/EmailBody.ts';
import {SignBody} from '../api/body/SignBody.ts';
import {SignProvider} from '../api/providers/SignProvider';
import {RegisterProvider} from '../api/providers/RegisterProvider';
import {createFormHandler} from '../utils/formHandler';

export default function PasswordReset() {
    const step = Number(sessionStorage.getItem('step')) || 1;
    const passwordResetId = sessionStorage.getItem('password_reset_id') || null;

    const [passwordResetFormData, setPasswordResetFormData] = useState({email: ''});
    const [codeFormData, setCodeFormData] = useState({code: '' as string | number, password: ''});

    const [loading, setLoading] = useState<boolean>(false);
    const [globalError, setGlobalError] = useState<string>('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});
    const [resendSuccess, setResendSuccess] = useState<boolean>(false);

    const navigate = useNavigate();
    const passwordResetProvider = new PasswordResetProvider();
    const signProvider = new SignProvider();
    const registerProvider = new RegisterProvider();

    const handlePasswordResetSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        const dto = new EmailBody(passwordResetFormData.email);
        try {
            const res = await passwordResetProvider.passwordReset(dto);

            sessionStorage.setItem('step', '2');
            sessionStorage.setItem('password_reset_id', res.id);
            sessionStorage.setItem('email', passwordResetFormData.email);
        } catch (err: any) {
            if (err.errors) {
                setFieldErrors(err.errors);
            } else if (err.error === 'User account is not confirmed.') {
                try {
                    const res = await registerProvider.register(dto);

                    sessionStorage.setItem('step', '2');
                    sessionStorage.setItem('register_id', res.id);
                    sessionStorage.setItem('email', passwordResetFormData.email);
                    sessionStorage.removeItem('password_reset_id');

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

        if (!passwordResetId) return;

        const dto = new PasswordResetBody(codeFormData.code, codeFormData.password);
        try {
            await passwordResetProvider.confirm(passwordResetId, dto);

            const email = sessionStorage.getItem('email') || '';
            const signDto = new SignBody(email, codeFormData.password, false);
            const res = await signProvider.sign(signDto);

            sessionStorage.setItem('step', '2');
            sessionStorage.setItem('sign_id', res.id);
            sessionStorage.removeItem('password_reset_id');

            navigate('/sign');
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!passwordResetId) return;

        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        try {
            await passwordResetProvider.resend(passwordResetId);
            setResendSuccess(true);
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const clearSessionDataAndGoToStep1 = () => {
        sessionStorage.setItem('step', '1');
        sessionStorage.removeItem('password_reset_id');
        sessionStorage.removeItem('email');

        navigate('/password-reset');
    };

    if (step === 2) {
        return <PasswordResetVerificationFormView
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

    return <PasswordResetFormView
        formData={passwordResetFormData}
        handleChange={createFormHandler(setPasswordResetFormData)}
        onSubmit={handlePasswordResetSubmit}
        loading={loading}
        fieldErrors={fieldErrors}
        globalError={globalError}
    />;
}