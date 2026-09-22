import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CodeBody } from '../../api/body/CodeBody';
import { EmailBody } from '../../api/body/EmailBody';
import { RegisterBody } from '../../api/body/RegisterBody';
import { SignBody } from '../../api/body/SignBody';
import { PasswordResetProvider } from '../../api/providers/PasswordResetProvider';
import { RegisterProvider } from '../../api/providers/RegisterProvider';
import { SignProvider } from '../../api/providers/SignProvider';
import { UserProvider } from '../../api/providers/UserProvider';
import { createFormHandler } from '../../utils/formHandler';
import { useFormState } from '../../utils/hooks/useFormState';

export function useRegister() {
    const step = Number(localStorage.getItem('register_step')) || 1;
    const registerId = localStorage.getItem('register_id') || null;
    const [registerFormData, setRegisterFormData] = useState(new RegisterBody('', '', '', 0, 0, '', '', '', []));
    const [codeFormData, setCodeFormData] = useState(new CodeBody(''));

    const { loading, globalError, fieldErrors, wrap } = useFormState();
    const [resendSuccess, setResendSuccess] = useState<boolean>(false);

    const navigate = useNavigate();
    const registerProvider = new RegisterProvider();
    const userProviders = new UserProvider();
    const signProvider = new SignProvider();
    const passwordResetProvider = new PasswordResetProvider();

    const handleRegisterSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        await wrap(async () => {
            await userProviders.createNano(registerFormData);
            const res = await registerProvider.register(new EmailBody(registerFormData.email));

            localStorage.setItem('register_step', '2');
            localStorage.setItem('register_id', res.id);
            localStorage.setItem('register_email', registerFormData.email);
            localStorage.setItem('register_password', registerFormData.password);
        }).catch(() => {});
    };

    const handleCodeSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!registerId) return;
        await wrap(async () => {
            await registerProvider.confirm(registerId, codeFormData);

            const email = localStorage.getItem('register_email') || '';
            const password = localStorage.getItem('register_password') || '';

            if (password) {
                const res = await signProvider.sign(new SignBody(email, password, false));

                localStorage.setItem('sign_step', '2');
                localStorage.setItem('sign_id', res.id);
                localStorage.removeItem('register_step');
                localStorage.removeItem('register_id');
                localStorage.removeItem('register_email');
                localStorage.removeItem('register_password');
                navigate('/sign');
            } else {
                const res = await passwordResetProvider.passwordReset(new EmailBody(email));

                localStorage.setItem('password_reset_step', '2');
                localStorage.setItem('password_reset_id', res.id);
                localStorage.setItem('password_reset_email', email);
                localStorage.removeItem('register_step');
                localStorage.removeItem('register_id');
                localStorage.removeItem('register_email');
                navigate('/password-reset');
            }
        }).catch(() => {});
    };

    const handleResend = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!registerId) return;
        await wrap(async () => {
            await registerProvider.resend(registerId);
            setResendSuccess(true);
        }).catch(() => {});
    };

    const clearSessionDataAndGoToStep1 = () => {
        localStorage.removeItem('register_step');
        localStorage.removeItem('register_id');
        localStorage.removeItem('register_email');
        localStorage.removeItem('register_password');
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
            fieldErrors,
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
            resendSuccess,
        },
    };
}
