import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CodeBody } from '../../api/body/CodeBody';
import { EmailBody } from '../../api/body/EmailBody';
import { SignBody } from '../../api/body/SignBody';
import { RegisterProvider } from '../../api/providers/RegisterProvider';
import { SignProvider } from '../../api/providers/SignProvider';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/api';
import { registerSession, signSession, UNCONFIRMED_ACCOUNT_ERROR } from '../../utils/authSession';
import { createFormHandler, createSubmitHandler } from '../../utils/formHandler';
import { useFormState } from '../../utils/hooks/useFormState';

export function useSign() {
    const [step, setStep] = useState(signSession.step);
    const signId = signSession.id();
    const [signFormData, setSignFormData] = useState(new SignBody('', '', false));
    const [codeFormData, setCodeFormData] = useState(new CodeBody(''));

    const { loading, globalError, fieldErrors, wrap, setGlobalError } = useFormState();
    const [resendSuccess, setResendSuccess] = useState<boolean>(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const signProvider = new SignProvider();
    const registerProvider = new RegisterProvider();

    const handleSignSubmit = createSubmitHandler(async () => {
        try {
            await wrap(async () => {
                const res = await signProvider.sign(signFormData);
                signSession.start(res.id, { rememberMe: signFormData.rememberMe ? '1' : '' });
                setStep(2);
            });
        } catch (err) {
            if (getErrorMessage(err) !== UNCONFIRMED_ACCOUNT_ERROR) return;
            try {
                const res = await registerProvider.register(new EmailBody(signFormData.email));
                registerSession.start(res.id, { email: signFormData.email, password: signFormData.password });
                signSession.clear();
                navigate('/register');
            } catch (registerErr) {
                setGlobalError(getErrorMessage(registerErr));
            }
        }
    });

    const handleCodeSubmit = createSubmitHandler(async () => {
        if (!signId) return;
        await wrap(async () => {
            const res = await signProvider.confirm(signId, codeFormData);
            const rememberMe = signSession.get('rememberMe') === '1';
            signSession.clear();
            login(res.token, signId, rememberMe);
            navigate('/');
        }).catch(() => {});
    });

    const handleResend = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!signId) return;
        await wrap(async () => {
            await signProvider.resend(signId);
            setResendSuccess(true);
        }).catch(() => {});
    };

    const clearSessionDataAndGoToStep1 = () => {
        signSession.clear();
        setStep(1);
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
