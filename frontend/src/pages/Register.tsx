import { RegisterFormView } from '../components/Authentication/RegisterFormView';
import { VerificationFormView } from '../components/Authentication/VerificationFormView';
import { useRegister } from '../services/Authentication/useRegister';

export default function Register() {
    const { step, registerProps, verificationProps } = useRegister();

    if (step === 2) {
        return <VerificationFormView {...verificationProps} />;
    }

    return <RegisterFormView {...registerProps} />;
}
