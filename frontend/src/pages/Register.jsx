import { useState } from 'react';
import {useNavigate} from 'react-router-dom';
import {RegisterService} from '../api/RegisterService';
import {UserService} from '../api/UserService';
import {RegisterFormView} from '../components/RegisterFormView';
import {VerificationFormView} from '../components/VerificationFormView';
import {RegisterDto} from '../api/dto/RegisterDto';
import {CodeDto} from '../api/dto/CodeDto';
import {EmailDto} from '../api/dto/EmailDto';
import {SignService} from '../api/SignService';
import {SignDto} from '../api/dto/SignDto';
import {PasswordResetService} from '../api/PasswordResetService';

export default function Register() {
    const step = Number(sessionStorage.getItem('step')) || 1;
    const registerId = sessionStorage.getItem('register_id') || null;
    const [registerFormData, setRegisterFormData] = useState({firstName: '', lastName: '', email: '', password: '', phone: '', birthAt: '', gender: '', country: '', roles: []});
    const [codeFormData, setCodeFormData] = useState({ code: '' });

    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [resendSuccess, setResendSuccess] = useState(false);

    const navigate = useNavigate();
    const registerService = new RegisterService();
    const userServices = new UserService();
    const signService = new SignService();
    const passwordResetService = new PasswordResetService();

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        const dto = new RegisterDto(registerFormData.birthAt, registerFormData.firstName, registerFormData.lastName, registerFormData.gender, registerFormData.phone, registerFormData.email, registerFormData.password, registerFormData.country, registerFormData.roles);
        try {
            await userServices.createNano(dto);

            const emailDto = new EmailDto(registerFormData.email);
            const res = await registerService.register(emailDto);

            sessionStorage.setItem('step', '2');
            sessionStorage.setItem('register_id', res.id);
            sessionStorage.setItem('email', registerFormData.email);
            sessionStorage.setItem('password', registerFormData.password);
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
            await registerService.confirm(registerId, dto);

            const email = sessionStorage.getItem('email');
            const password = sessionStorage.getItem('password');

            if (password) {
                const signDto = new SignDto(email, password, false);
                const res = await signService.sign(signDto);

                sessionStorage.setItem('step', '2');
                sessionStorage.setItem('sign_id', res.id);
                sessionStorage.removeItem('register_id');

                navigate('/sign');
            } else {
                const emailDto = new EmailDto(email);
                const res = await passwordResetService.passwordReset(emailDto);

                sessionStorage.setItem('step', '2');
                sessionStorage.setItem('password_reset_id', res.id);
                sessionStorage.removeItem('register_id');

                navigate('/password-reset');
            }
        } catch (err) {
            setGlobalError(err.error);
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
            await registerService.resend(registerId);
            setResendSuccess(true);
        } catch (err) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const clearSessionDataAndGoToStep1 = () => {
        sessionStorage.setItem('step', '1');
        sessionStorage.removeItem('register_id');
        sessionStorage.removeItem('email');
        sessionStorage.removeItem('password');

        navigate('/register');
    };

    const createHandler = (setter) => (e) => {
        const {name, value, type, checked, multiple, options} = e.target;
        let newValue;
        if (type === 'checkbox') {
            newValue = checked;
        } else if (multiple) {
            newValue = Array.from(options).filter(option => option.selected).map(option => option.value);
        } else {
            newValue = value;
        }
        setter(prev => ({
            ...prev,
            [name]: newValue
        }));
    };

    if (step === 2) {
        return <VerificationFormView
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

    return <RegisterFormView
        formData={registerFormData}
        handleChange={createHandler(setRegisterFormData)}
        onSubmit={handleRegisterSubmit}
        loading={loading}
        fieldErrors={fieldErrors}
        globalError={globalError}
    />;
}