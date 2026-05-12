import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PasswordResetService } from '../api/PasswordResetService';
import { PasswordResetDto } from '../api/dto/PasswordResetDto';
import { PasswordResetFormView } from '../components/PasswordResetFormView';
import { PasswordResetVerificationFormView } from '../components/PasswordResetVerificationFormView';
import { EmailDto } from '../api/dto/EmailDto';

export default function PasswordReset() {
    const [step, setStep] = useState(() => JSON.parse(sessionStorage.getItem('password_reset_step')) || 1);
    const [passwordResetId, setPasswordResetId] = useState(() => sessionStorage.getItem('password_reset_id') || null);
    const [passwordResetFormData, setPasswordResetFormData] = useState(() =>
        JSON.parse(sessionStorage.getItem('password_reset_data')) || { email: '', password: '', rememberMe: false }
    );
    const [codeFormData, setCodeFormData] = useState(() =>
        JSON.parse(sessionStorage.getItem('password_reset_code')) || { code: '' }
    );

    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [resendSuccess, setResendSuccess] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();
    const passwordResetService = new PasswordResetService();

    useEffect(() => {
        sessionStorage.setItem('password_reset_step', JSON.stringify(step));
        sessionStorage.setItem('password_reset_id', passwordResetId);
        sessionStorage.setItem('password_reset_data', JSON.stringify(passwordResetFormData));
        sessionStorage.setItem('password_reset_code', JSON.stringify(codeFormData));
    }, [step, passwordResetId, passwordResetFormData, codeFormData]);

    const handlePasswordResetSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        const dto = new EmailDto(passwordResetFormData.email);
        try {
            const res = await passwordResetService.passwordReset(dto);
            setPasswordResetId(res.id);
            setStep(2);
        } catch (err) {
            if (err.errors) setFieldErrors(err.errors);
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
            const res = await passwordResetService.confirm(passwordResetId, dto);
            login(res.token, passwordResetId, passwordResetFormData.rememberMe);
            navigate('/');
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
            onCancel={() => { setStep(1); setPasswordResetId(null); }}
            fieldErrors={fieldErrors}
            globalError={globalError}
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