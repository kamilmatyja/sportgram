import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CodeBody } from '../../api/body/CodeBody';
import { EmailBody } from '../../api/body/EmailBody';
import { SignBody } from '../../api/body/SignBody';
import { RegisterProvider } from '../../api/providers/RegisterProvider';
import { SignProvider } from '../../api/providers/SignProvider';
import { useAuth } from '../../context/AuthContext';
import { createFormHandler } from '../../utils/formHandler';
import { useFormState } from '../../utils/hooks/useFormState';

export function useSign() {
    const step = Number(localStorage.getItem('sign_step')) || 1;
    const signId = localStorage.getItem('sign_id') || null;
    const [signFormData, setSignFormData] = useState(new SignBody('', '', false));
    const [codeFormData, setCodeFormData] = useState(new CodeBody(''));

    const { loading, globalError, fieldErrors, wrap, setGlobalError } = useFormState();
    const [resendSuccess, setResendSuccess] = useState<boolean>(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const signProvider = new SignProvider();
    const registerProvider = new RegisterProvider();

    const handleSignSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            await wrap(async () => {
                const res = await signProvider.sign(signFormData);

                localStorage.setItem('sign_step', '2');
                localStorage.setItem('sign_id', res.id);
            });
        } catch (err: any) {
            if (err.error === 'User account is not confirmed.') {
                try {
                    const dto = new EmailBody(signFormData.email);
                    const res = await registerProvider.register(dto);

                    localStorage.setItem('register_step', '2');
                    localStorage.setItem('register_id', res.id);
                    localStorage.setItem('register_email', signFormData.email);
                    localStorage.setItem('register_password', signFormData.password);
                    localStorage.removeItem('sign_step');
                    localStorage.removeItem('sign_id');
                    navigate('/register');
                } catch (registerErr: any) {
                    setGlobalError(registerErr.error);
                }
            }
        }
    };

    const handleCodeSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!signId) return;
        await wrap(async () => {
            const res = await signProvider.confirm(signId, codeFormData);

            localStorage.removeItem('sign_step');
            localStorage.removeItem('sign_id');
            login(res.token, signId, signFormData.rememberMe);
            navigate('/');
        }).catch(() => {});
    };

    const handleResend = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!signId) return;
        await wrap(async () => {
            await signProvider.resend(signId);
            setResendSuccess(true);
        }).catch(() => {});
    };

    const clearSessionDataAndGoToStep1 = () => {
        localStorage.removeItem('sign_step');
        localStorage.removeItem('sign_id');
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
