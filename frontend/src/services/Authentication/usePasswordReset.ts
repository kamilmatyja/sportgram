import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { EmailBody } from '../../api/body/EmailBody';
import { PasswordResetBody } from '../../api/body/PasswordResetBody';
import { SignBody } from '../../api/body/SignBody';
import { PasswordResetProvider } from '../../api/providers/PasswordResetProvider';
import { RegisterProvider } from '../../api/providers/RegisterProvider';
import { SignProvider } from '../../api/providers/SignProvider';
import { getErrorMessage } from '../../utils/api';
import { passwordResetSession, registerSession, signSession, UNCONFIRMED_ACCOUNT_ERROR } from '../../utils/authSession';
import { createFormHandler, createSubmitHandler } from '../../utils/formHandler';
import { useFormState } from '../../utils/hooks/useFormState';

export function usePasswordReset() {
    const [step, setStep] = useState(passwordResetSession.step);
    const passwordResetId = passwordResetSession.id();
    const [passwordResetFormData, setPasswordResetFormData] = useState(new EmailBody(''));
    const [codeFormData, setCodeFormData] = useState(new PasswordResetBody('', ''));

    const { loading, globalError, fieldErrors, wrap, setGlobalError } = useFormState();
    const [resendSuccess, setResendSuccess] = useState<boolean>(false);

    const navigate = useNavigate();
    const passwordResetProvider = new PasswordResetProvider();
    const signProvider = new SignProvider();
    const registerProvider = new RegisterProvider();

    const handlePasswordResetSubmit = createSubmitHandler(async () => {
        try {
            await wrap(async () => {
                const res = await passwordResetProvider.passwordReset(passwordResetFormData);
                passwordResetSession.start(res.id, { email: passwordResetFormData.email });
                setStep(2);
            });
        } catch (err) {
            if (getErrorMessage(err) !== UNCONFIRMED_ACCOUNT_ERROR) return;
            try {
                const res = await registerProvider.register(passwordResetFormData);
                registerSession.start(res.id, { email: passwordResetFormData.email });
                passwordResetSession.clear();
                navigate('/register');
            } catch (registerErr) {
                setGlobalError(getErrorMessage(registerErr));
            }
        }
    });

    const handleCodeSubmit = createSubmitHandler(async () => {
        if (!passwordResetId) return;
        await wrap(async () => {
            await passwordResetProvider.confirm(passwordResetId, codeFormData);

            const email = passwordResetSession.get('email');
            const res = await signProvider.sign(new SignBody(email, codeFormData.password, false));

            signSession.start(res.id);
            passwordResetSession.clear();
            navigate('/sign');
        }).catch(() => {});
    });

    const handleResend = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!passwordResetId) return;
        await wrap(async () => {
            await passwordResetProvider.resend(passwordResetId);
            setResendSuccess(true);
        }).catch(() => {});
    };

    const clearSessionDataAndGoToStep1 = () => {
        passwordResetSession.clear();
        setStep(1);
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
