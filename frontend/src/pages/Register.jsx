import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {RegisterService} from '../api/RegisterService';
import {RegisterFormView} from '../components/RegisterFormView';
import {VerificationView} from '../components/VerificationView';
import {RegisterDto} from "../api/dto/RegisterDto.js";
import {CodeDto} from "../api/dto/CodeDto.js";

export default function Register() {
    const [step, setStep] = useState(() => JSON.parse(sessionStorage.getItem('register_step')) || 1);
    const [registerId, setRegisterId] = useState(() => sessionStorage.getItem('register_id') || null);
    const [registerFormData, setRegisterFormData] = useState(() =>
            JSON.parse(sessionStorage.getItem('register_data')) || {
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                phone: '',
                birthAt: '',
                gender: '',
                country: '',
                roles: []
            }
    );
    const [codeFormData, setCodeFormData] = useState({code: ''});

    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [resendSuccess, setResendSuccess] = useState(false);

    const navigate = useNavigate();
    const registerService = new RegisterService();

    useEffect(() => {
        sessionStorage.setItem('register_step', JSON.stringify(step));
        sessionStorage.setItem('register_id', registerId);
        sessionStorage.setItem('register_data', JSON.stringify(registerFormData));
    }, [step, registerId, registerFormData]);

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});

        const dto = new RegisterDto(registerFormData.birthAt, registerFormData.firstName, registerFormData.lastName, registerFormData.gender, registerFormData.phone, registerFormData.email, registerFormData.password, registerFormData.country, registerFormData.roles);
        try {
            const res = await registerService.register(dto);
            setRegisterId(res.id);
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
            await registerService.confirm(registerId, dto);
            sessionStorage.clear();
            navigate('/sign');
        } catch (err) {
            setGlobalError(err.error || 'Błędny kod');
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
        return <VerificationView
            formData={codeFormData}
            handleChange={createHandler(setCodeFormData)}
            onSubmit={handleCodeSubmit}
            loading={loading}
            onCancel={() => {
                setStep(1);
                setRegisterId(null);
            }}
            fieldErrors={fieldErrors}
            globalError={globalError}
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