import {usePasswordReset} from '../services/Authentication/usePasswordReset';
import {PasswordResetFormView} from '../components/Authentication/PasswordResetFormView';
import {PasswordResetVerificationFormView} from '../components/Authentication/PasswordResetVerificationFormView';

export default function PasswordReset() {
    const {step, passwordResetProps, verificationProps} = usePasswordReset();

    if (step === 2) {
        return <PasswordResetVerificationFormView {...verificationProps} />;
    }

    return <PasswordResetFormView {...passwordResetProps} />;
}