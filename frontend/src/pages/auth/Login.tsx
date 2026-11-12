import { useState, type SyntheticEvent } from 'react';
import {
    Paper,
    Title,
    TextInput,
    PasswordInput,
    Checkbox,
    Button,
    Stack,
    Anchor,
    Group,
    Text,
    Container,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { authService } from '../../api/services';
import { useAuth } from '../../auth';
import { useFormErrors } from '../../hooks';
import { signSession, registerSession, UNCONFIRMED_ACCOUNT_ERROR } from '../../utils';
import { AuthVerificationStep } from './AuthVerificationStep';

export default function Login() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuth();
    const { fieldErrors, handleFormError, clearFieldError, clearFieldErrors } = useFormErrors();

    const [step, setStep] = useState<number>(signSession.step);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const signId = signSession.id();

    const handleSignSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        clearFieldErrors();

        try {
            const data = await authService.sign({ body: { email, password } });
            if (!data?.id) {
                notifications.show({ title: t('error'), message: t('error'), color: 'red' });
                return;
            }

            signSession.start(data.id, { rememberMe: rememberMe ? '1' : '' });
            notifications.show({
                title: t('sign'),
                message: t('enterVerificationCodePrompt'),
                color: 'green',
            });
            setStep(2);
        } catch (apiErr) {
            const { msg } = handleFormError(apiErr, { notifyOnlyIfNoFields: true });
            if (msg === UNCONFIRMED_ACCOUNT_ERROR) {
                try {
                    const res = await authService.register({ body: { email } });
                    if (res?.id) {
                        registerSession.start(res.id, { email, password });
                        signSession.clear();
                        void navigate('/register');
                        return;
                    }
                } catch {
                    void 0;
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (!signId) return;

        setLoading(true);
        clearFieldErrors();

        try {
            const data = await authService.confirmSign({
                params: { path: { id: signId } },
                body: { code: Number(code) },
            });
            if (!data?.token) {
                notifications.show({ title: t('error'), message: t('error'), color: 'red' });
                return;
            }

            const isRemember = signSession.get('rememberMe') === '1';
            signSession.clear();
            login(data.token, signId, isRemember);
            notifications.show({
                title: t('sign'),
                message: t('loginSuccess'),
                color: 'green',
            });
            void navigate('/');
        } catch (err) {
            handleFormError(err, { notifyOnlyIfNoFields: true });
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!signId) return;
        setLoading(true);
        try {
            await authService.resendSign({ params: { path: { id: signId } } });
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

    const handleBackToStep1 = () => {
        signSession.clear();
        setStep(1);
        clearFieldErrors();
    };

    return (
        <Container size="xs" py="xl">
            <Paper p="xl">
                <Title order={2} ta="center" mb="lg">
                    {step === 1 ? t('sign') : `${t('sign')} – ${t('verify')}`}
                </Title>

                {step === 1 ? (
                    <form
                        onSubmit={(event) => {
                            void handleSignSubmit(event);
                        }}
                    >
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

                            <PasswordInput
                                label={t('password')}
                                required
                                placeholder={t('passwordPlaceholder')}
                                value={password}
                                error={fieldErrors.password}
                                onChange={(e) => {
                                    setPassword(e.currentTarget.value);
                                    clearFieldError('password');
                                }}
                            />

                            <Group justify="space-between" mt="xs">
                                <Checkbox
                                    label={t('rememberMe')}
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.currentTarget.checked)}
                                />
                                <Anchor component={Link} to="/password-reset" size="xs">
                                    {t('passwordReset')}?
                                </Anchor>
                            </Group>

                            <Button
                                type="submit"
                                fullWidth
                                mt="md"
                                loading={loading}
                                disabled={loading || !email.trim() || !password}
                            >
                                {t('sign')}
                            </Button>

                            <Text c="dimmed" size="xs" ta="center" mt="sm">
                                {t('dontHaveAccount')}{' '}
                                <Anchor component={Link} to="/register" size="xs">
                                    {t('register')}
                                </Anchor>
                            </Text>
                        </Stack>
                    </form>
                ) : (
                    <AuthVerificationStep
                        code={code}
                        onCodeChange={(val) => {
                            setCode(val);
                            clearFieldError('code');
                        }}
                        onSubmit={(event) => {
                            void handleCodeSubmit(event);
                        }}
                        onBack={handleBackToStep1}
                        onResend={() => {
                            void handleResend();
                        }}
                        loading={loading}
                        error={fieldErrors.code}
                    />
                )}
            </Paper>
        </Container>
    );
}
