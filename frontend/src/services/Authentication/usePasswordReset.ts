import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { EmailBody } from '../../api/body/EmailBody';
import { PasswordResetBody } from '../../api/body/PasswordResetBody';
import { SignBody } from '../../api/body/SignBody';
import { PasswordResetProvider } from '../../api/providers/PasswordResetProvider';
import { RegisterProvider } from '../../api/providers/RegisterProvider';
import { SignProvider } from '../../api/providers/SignProvider';
import { createFormHandler } from '../../utils/formHandler';
import { useFormState } from '../../utils/hooks/useFormState';

export function usePasswordReset() {
    const step = Number(localStorage.getItem('password_reset_step')) || 1;
    const passwordResetId = localStorage.getItem('password_reset_id') || null;
    const [passwordResetFormData, setPasswordResetFormData] = useState(new EmailBody(''));
    const [codeFormData, setCodeFormData] = useState(new PasswordResetBody('', ''));

    const { loading, globalError, fieldErrors, wrap, setGlobalError } = useFormState();
    const [resendSuccess, setResendSuccess] = useState<boolean>(false);

    const navigate = useNavigate();
    const passwordResetProvider = new PasswordResetProvider();
    const signProvider = new SignProvider();
    const registerProvider = new RegisterProvider();

    const handlePasswordResetSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            await wrap(async () => {
                const res = await passwordResetProvider.passwordReset(passwordResetFormData);

                localStorage.setItem('password_reset_step', '2');
                localStorage.setItem('password_reset_id', res.id);
                localStorage.setItem('password_reset_email', passwordResetFormData.email);
            });
        } catch (err: any) {
            if (err.error === 'User account is not confirmed.') {
                try {
                    const res = await registerProvider.register(passwordResetFormData);

                    localStorage.setItem('register_step', '2');
                    localStorage.setItem('register_id', res.id);
                    localStorage.setItem('register_email', passwordResetFormData.email);
                    localStorage.removeItem('password_reset_step');
                    localStorage.removeItem('password_reset_id');
                    localStorage.removeItem('password_reset_email');
                    navigate('/register');
                } catch (registerErr: any) {
                    setGlobalError(registerErr.error);
                }
            }
        }
    };

    const handleCodeSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!passwordResetId) return;
        await wrap(async () => {
            await passwordResetProvider.confirm(passwordResetId, codeFormData);

            const email = localStorage.getItem('password_reset_email') || '';
            const res = await signProvider.sign(new SignBody(email, codeFormData.password, false));

            localStorage.setItem('sign_step', '2');
            localStorage.setItem('sign_id', res.id);
            localStorage.removeItem('password_reset_step');
            localStorage.removeItem('password_reset_id');
            localStorage.removeItem('password_reset_email');
            navigate('/sign');
        }).catch(() => {});
    };

    const handleResend = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!passwordResetId) return;
        await wrap(async () => {
            await passwordResetProvider.resend(passwordResetId);
            setResendSuccess(true);
        }).catch(() => {});
    };

    const clearSessionDataAndGoToStep1 = () => {
        localStorage.removeItem('password_reset_step');
        localStorage.removeItem('password_reset_id');
        localStorage.removeItem('password_reset_email');
        navigate('/password-reset');
    };

    const handlePasswordResetChange = createFormHandler(setPasswordResetFormData);
    const handleCodeChange = createFormHandler(setCodeFormData);

    return {
        step,
        passwordResetProps: {
            formData: passwordResetFormData,
            handleChange: handlePasswordResetChange,
            onSubmit: handlePasswordResetSubmit,
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
