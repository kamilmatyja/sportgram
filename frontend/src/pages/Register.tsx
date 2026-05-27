import {useRegister} from '../services/Authentication/useRegister';
import {RegisterFormView} from '../components/Authentication/RegisterFormView';
import {VerificationFormView} from '../components/Authentication/VerificationFormView';

export default function Register() {
    const {step, registerProps, verificationProps} = useRegister();

    if (step === 2) {
        return <VerificationFormView {...verificationProps} />;
    }

    return <RegisterFormView {...registerProps} />;
}