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
import { passwordResetSession, registerSession, signSession } from '../../utils/authSession';
import { createFormHandler, createSubmitHandler } from '../../utils/formHandler';
import { useFormState } from '../../utils/hooks/useFormState';

export function useRegister() {
    const [step, setStep] = useState(registerSession.step);
    const registerId = registerSession.id();
    const [registerFormData, setRegisterFormData] = useState(new RegisterBody('', '', '', 0, 0, '', '', 0, []));
    const [codeFormData, setCodeFormData] = useState(new CodeBody(''));

    const { loading, globalError, fieldErrors, wrap } = useFormState();
    const [resendSuccess, setResendSuccess] = useState<boolean>(false);

    const navigate = useNavigate();
    const registerProvider = new RegisterProvider();
    const userProvider = new UserProvider();
    const signProvider = new SignProvider();
    const passwordResetProvider = new PasswordResetProvider();

    const handleRegisterSubmit = createSubmitHandler(() =>
        wrap(async () => {
            await userProvider.createNano(registerFormData);
            const res = await registerProvider.register(new EmailBody(registerFormData.email));
            registerSession.start(res.id, { email: registerFormData.email, password: registerFormData.password });
            setStep(2);
        }).catch(() => {}),
    );

    const handleCodeSubmit = createSubmitHandler(async () => {
        if (!registerId) return;
        await wrap(async () => {
            await registerProvider.confirm(registerId, codeFormData);

            const email = registerSession.get('email');
            const password = registerSession.get('password');

            if (password) {
                const res = await signProvider.sign(new SignBody(email, password, false));
                signSession.start(res.id);
                registerSession.clear();
                navigate('/sign');
            } else {
                const res = await passwordResetProvider.passwordReset(new EmailBody(email));
                passwordResetSession.start(res.id, { email });
                registerSession.clear();
                navigate('/password-reset');
            }
        }).catch(() => {});
    });

    const handleResend = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!registerId) return;
        await wrap(async () => {
            await registerProvider.resend(registerId);
            setResendSuccess(true);
        }).catch(() => {});
    };

    const clearSessionDataAndGoToStep1 = () => {
        registerSession.clear();
        setStep(1);
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
