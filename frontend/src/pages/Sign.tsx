import {useSign} from '../services/useSign';
import {SignFormView} from '../components/SignFormView';
import {VerificationFormView} from '../components/VerificationFormView';

export default function Sign() {
    const {step, signProps, verificationProps} = useSign();

    if (step === 2) {
        return <VerificationFormView {...verificationProps} />;
    }

    return <SignFormView {...signProps} />;
}