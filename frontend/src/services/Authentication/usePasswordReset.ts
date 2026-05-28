import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {PasswordResetProvider} from '../../api/providers/PasswordResetProvider';
import {RegisterProvider} from '../../api/providers/RegisterProvider';
import {SignProvider} from '../../api/providers/SignProvider';
import {PasswordResetBody} from '../../api/body/PasswordResetBody';
import {EmailBody} from '../../api/body/EmailBody';
import {SignBody} from '../../api/body/SignBody';
import {createFormHandler} from '../../utils/formHandler';
import {useFormState} from '../../utils/hooks/useFormState';

export function usePasswordReset() {
    const step = Number(sessionStorage.getItem('step')) || 1;
    const passwordResetId = sessionStorage.getItem('password_reset_id') || null;
    const [passwordResetFormData, setPasswordResetFormData] = useState(new EmailBody(''));
    const [codeFormData, setCodeFormData] = useState(new PasswordResetBody('', ''));

    const { loading, globalError, fieldErrors, wrap, resetErrors, setGlobalError } = useFormState();
    const [resendSuccess, setResendSuccess] = useState<boolean>(false);

    const navigate = useNavigate();
    const passwordResetProvider = new PasswordResetProvider();
    const signProvider = new SignProvider();
    const registerProvider = new RegisterProvider();

    const handlePasswordResetSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        resetErrors();

        await wrap(async () => {
            const res = await passwordResetProvider.passwordReset(passwordResetFormData);
            sessionStorage.setItem('step', '2');
            sessionStorage.setItem('password_reset_id', res.id);
            sessionStorage.setItem('email', passwordResetFormData.email);
        }).catch(async (err: any) => {
            if (err.error === 'User account is not confirmed.') {
                try {
                    const res = await registerProvider.register(passwordResetFormData);
                    sessionStorage.setItem('step', '2');
                    sessionStorage.setItem('register_id', res.id);
                    sessionStorage.setItem('email', passwordResetFormData.email);
                    sessionStorage.removeItem('password_reset_id');
                    navigate('/register');
                } catch (registerErr: any) {
                    setGlobalError(registerErr.error);
                }
            }
        });
    };

    const handleCodeSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!passwordResetId) return;
        resetErrors();

        await wrap(async () => {
            await passwordResetProvider.confirm(passwordResetId, codeFormData);
            const email = sessionStorage.getItem('email') || '';
            const dto = new SignBody(email, codeFormData.password, false);
            const res = await signProvider.sign(dto);

            sessionStorage.setItem('step', '2');
            sessionStorage.setItem('sign_id', res.id);
            sessionStorage.removeItem('password_reset_id');
            navigate('/sign');
        }).catch(() => {});
    };

    const handleResend = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!passwordResetId) return;
        resetErrors();

        await wrap(async () => {
            await passwordResetProvider.resend(passwordResetId);
            setResendSuccess(true);
        }).catch(() => {});
    };

    const clearSessionDataAndGoToStep1 = () => {
        sessionStorage.setItem('step', '1');
        sessionStorage.removeItem('password_reset_id');
        sessionStorage.removeItem('email');
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