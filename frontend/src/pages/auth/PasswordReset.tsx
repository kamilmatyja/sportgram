import { useState, type SyntheticEvent } from 'react';
import { Paper, Title, TextInput, PasswordInput, Button, Stack, Anchor, Text, Container } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { authService } from '../../api/services';
import { useFormErrors } from '../../hooks';
import { useOffline } from '../../services';
import { passwordResetSession, signSession } from '../../utils';
import { AuthVerificationStep } from './AuthVerificationStep';

export default function PasswordReset() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isOffline } = useOffline();
    const { fieldErrors, handleFormError, clearFieldError, clearFieldErrors } = useFormErrors();

    const [step, setStep] = useState<number>(passwordResetSession.step);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const resetId = passwordResetSession.id();

    const handleEmailSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        clearFieldErrors();

        try {
            const data = await authService.passwordReset({ body: { email } });
            if (!data?.id) {
                notifications.show({ title: t('error'), message: t('error'), color: 'red' });
                return;
            }

            passwordResetSession.start(data.id, { email });
            notifications.show({
                title: t('passwordReset'),
                message: t('enterResetCodeAndNewPassword'),
                color: 'green',
            });
            setStep(2);
        } catch (err) {
            handleFormError(err, { notifyOnlyIfNoFields: true });
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (!resetId) return;

        setLoading(true);
        clearFieldErrors();

        try {
            await authService.confirmPasswordReset({
                params: { path: { id: resetId } },
                body: {
                    password,
                    code: Number(code),
                },
            });

            const storedEmail = passwordResetSession.get('email');
            passwordResetSession.clear();

            if (storedEmail) {
                try {
                    const signRes = await authService.sign({
                        body: {
                            email: storedEmail,
                            password,
                        },
                    });
                    if (signRes?.id) {
                        signSession.start(signRes.id);
                    }
                } catch {
                    void 0;
                }
            }

            notifications.show({
                title: t('passwordReset'),
                message: t('passwordResetSuccess'),
                color: 'green',
            });
            navigate('/sign');
        } catch (err) {
            handleFormError(err, { notifyOnlyIfNoFields: true });
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!resetId) return;
        setLoading(true);
        try {
            await authService.resendPasswordReset({ params: { path: { id: resetId } } });
            notifications.show({
                title: t('resend'),
                message: t('resendSuccess'),
                color: 'green',
            });
        } catch (err) {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size="xs" py="xl">
            <Paper p="xl">
                <Title order={2} ta="center" mb="lg">
                    {step === 1 ? t('passwordReset') : `${t('passwordReset')} – ${t('verify')}`}
                </Title>

                {step === 1 ? (
                    <form onSubmit={handleEmailSubmit}>
                        <Stack>
                            <TextInput
                                label={t('email')}
                                required
                                type="email"
                                placeholder={t('emailPlaceholder')}
                                value={email}
                                error={fieldErrors.email}
                                onChange={(e) => {
                                    setEmail(e.currentTarget.value);
                                    clearFieldError('email');
                                }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                mt="md"
                                loading={loading}
                                disabled={loading || !email.trim() || isOffline}
                            >
                                {t('send')}
                            </Button>

                            <Text c="dimmed" size="xs" ta="center" mt="sm">
                                {t('rememberPassword')}{' '}
                                <Anchor component={Link} to="/sign" size="xs">
                                    {t('sign')}
                                </Anchor>
                            </Text>
                        </Stack>
                    </form>
                ) : (
                    <AuthVerificationStep
                        promptText={t('enterResetCodeAndNewPassword')}
                        code={code}
                        onCodeChange={(val) => {
                            setCode(val);
                            clearFieldError('code');
                        }}
                        onSubmit={handleCodeSubmit}
                        onBack={() => {
                            passwordResetSession.clear();
                            setStep(1);
                            clearFieldErrors();
                        }}
                        onResend={handleResend}
                        loading={loading}
                        error={fieldErrors.code}
                        submitLabel={t('save')}
                        isSubmitDisabled={!password}
                    >
                        <PasswordInput
                            label={t('newPassword')}
                            required
                            placeholder={t('passwordPlaceholder')}
                            value={password}
                            error={fieldErrors.password || fieldErrors.newPassword}
                            onChange={(e) => {
                                setPassword(e.currentTarget.value);
                                clearFieldError('password');
                                clearFieldError('newPassword');
                            }}
                            w="100%"
                        />
                    </AuthVerificationStep>
                )}
            </Paper>
        </Container>
    );
}
