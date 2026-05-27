import {useRegister} from '../services/useRegister';
import {RegisterFormView} from '../components/RegisterFormView';
import {VerificationFormView} from '../components/VerificationFormView';

export default function Register() {
    const {step, registerProps, verificationProps} = useRegister();

    if (step === 2) {
        return <VerificationFormView {...verificationProps} />;
    }

    return <RegisterFormView {...registerProps} />;
}