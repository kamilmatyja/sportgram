import { SignFormView } from '../components/Authentication/SignFormView';
import { VerificationFormView } from '../components/Authentication/VerificationFormView';
import { useSign } from '../services/Authentication/useSign';

export default function Sign() {
    const { step, signProps, verificationProps } = useSign();

    if (step === 2) {
        return <VerificationFormView {...verificationProps} />;
    }

    return <SignFormView {...signProps} />;
}
