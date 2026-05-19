import {usePasswordReset} from '../services/usePasswordReset';
import {PasswordResetFormView} from '../components/PasswordResetFormView';
import {PasswordResetVerificationFormView} from '../components/PasswordResetVerificationFormView';

export default function PasswordReset() {
    const {step, passwordResetProps, verificationProps} = usePasswordReset();

    if (step === 2) {
        return <PasswordResetVerificationFormView {...verificationProps} />;
    }

    return <PasswordResetFormView {...passwordResetProps} />;
}