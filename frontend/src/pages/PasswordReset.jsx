import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PasswordResetService } from '../api/PasswordResetService';
import { PasswordResetDto } from '../api/dto/PasswordResetDto';
import { PasswordResetFormView } from '../components/PasswordResetFormView';
import { PasswordResetVerificationFormView } from '../components/PasswordResetVerificationFormView';
import { EmailDto } from '../api/dto/EmailDto';
import {SignDto} from '../api/dto/SignDto';
import {SignService} from '../api/SignService';
import {RegisterService} from '../api/RegisterService';

export default function PasswordReset() {
    const step = Number(sessionStorage.getItem('step')) || 1;
    const passwordResetId = sessionStorage.getItem('password_reset_id') || null;
    const [passwordResetFormData, setPasswordResetFormData] = useState({email: ''});
    const [codeFormData, setCodeFormData] = useState({ code: '', password: '' });

    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [resendSuccess, setResendSuccess] = useState(false);

    const navigate = useNavigate();
    const passwordResetService = new PasswordResetService();
    const signService = new SignService();
    const registerService = new RegisterService();

    const handlePasswordResetSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        const dto = new EmailDto(passwordResetFormData.email);
        try {
            const res = await passwordResetService.passwordReset(dto);

            sessionStorage.setItem('step', '2');
            sessionStorage.setItem('password_reset_id', res.id);
            sessionStorage.setItem('email', passwordResetFormData.email);
        } catch (err) {
            if (err.errors) setFieldErrors(err.errors);
            else if (err.error === 'User account is not confirmed.') {
                try {
                    const res = await registerService.register(dto);

                    sessionStorage.setItem('step', '2');
                    sessionStorage.setItem('register_id', res.id);
                    sessionStorage.setItem('email', passwordResetFormData.email);
                    sessionStorage.removeItem('password_reset_id');

                    navigate('/register');
                } catch (err) {
                    if (err.errors) setFieldErrors(err.errors);
                    else setGlobalError(err.error);
                }
            }
            else setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        const dto = new PasswordResetDto(codeFormData.code, codeFormData.password);
        try {
            await passwordResetService.confirm(passwordResetId, dto)

            const signDto = new SignDto(sessionStorage.getItem('email'), codeFormData.password, false);
            const res = await signService.sign(signDto);

            sessionStorage.setItem('step', '2');
            sessionStorage.setItem('sign_id', res.id);
            sessionStorage.removeItem('password_reset_id');

            navigate('/sign');
        } catch (err) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        try {
            await passwordResetService.resend(passwordResetId);
            setResendSuccess(true);
        } catch (err) {
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

    const createHandler = (setter) => (e) => {
        const { name, value, type, checked } = e.target;
        setter(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    if (step === 2) {
        return <PasswordResetVerificationFormView
            formData={codeFormData}
            handleChange={createHandler(setCodeFormData)}
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
        handleChange={createHandler(setPasswordResetFormData)}
        onSubmit={handlePasswordResetSubmit}
        loading={loading}
        fieldErrors={fieldErrors}
        globalError={globalError}
    />;
}