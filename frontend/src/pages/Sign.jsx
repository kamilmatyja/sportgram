import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { SignService } from '../api/SignService';
import { SignDto } from '../api/dto/SignDto';
import { SignFormView } from '../components/sign/SignFormView';
import { VerificationFormView } from '../components/sign/VerificationFormView';
import { CodeDto } from '../api/dto/CodeDto.js';

export default function Sign() {
    const [step, setStep] = useState(() => JSON.parse(sessionStorage.getItem('sign_step')) || 1);
    const [signId, setSignId] = useState(() => sessionStorage.getItem('sign_id') || null);
    const [signFormData, setSignFormData] = useState(() =>
        JSON.parse(sessionStorage.getItem('sign_data')) || { email: '', password: '', rememberMe: false }
    );
    const [codeFormData, setCodeFormData] = useState(() =>
        JSON.parse(sessionStorage.getItem('sign_code')) || { code: '' }
    );

    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [resendSuccess, setResendSuccess] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();
    const signService = new SignService();

    useEffect(() => {
        sessionStorage.setItem('sign_step', JSON.stringify(step));
        sessionStorage.setItem('sign_id', signId);
        sessionStorage.setItem('sign_data', JSON.stringify(signFormData));
        sessionStorage.setItem('sign_code', JSON.stringify(codeFormData));
    }, [step, signId, signFormData, codeFormData]);

    const handleSignSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        const dto = new SignDto(signFormData.email, signFormData.password, signFormData.rememberMe);
        try {
            const res = await signService.sign(dto);
            setSignId(res.id);
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

        const dto = new CodeDto(codeFormData.code);
        try {
            const res = await signService.confirm(signId, dto);

            login(res.token, signId, signFormData.rememberMe);

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
            await signService.resend(signId);
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
        return <VerificationFormView
            formData={codeFormData}
            handleChange={createHandler(setCodeFormData)}
            onSubmit={handleCodeSubmit}
            loading={loading}
            onCancel={() => { setStep(1); setSignId(null); }}
            fieldErrors={fieldErrors}
            globalError={globalError}
            onResend={handleResend}
            resendSuccess={resendSuccess}
        />;
    }

    return <SignFormView
        formData={signFormData}
        handleChange={createHandler(setSignFormData)}
        onSubmit={handleSignSubmit}
        loading={loading}
        fieldErrors={fieldErrors}
        globalError={globalError}
    />;
}