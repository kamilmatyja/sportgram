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
    Alert,
    Group,
    PinInput,
    Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { authService } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { signSession, registerSession, UNCONFIRMED_ACCOUNT_ERROR } from '../../utils/authSession';

export default function Login() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuth();

    const [step, setStep] = useState<number>(signSession.step);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [code, setCode] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const signId = signSession.id();

    const handleSignSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = await authService.sign({ email, password });
            if (!data?.id) {
                setError(t('error'));
                return;
            }

            signSession.start(data.id, { rememberMe: rememberMe ? '1' : '' });
            setStep(2);
        } catch (apiErr) {
            const msg = getErrorMessage(apiErr);
            if (msg === UNCONFIRMED_ACCOUNT_ERROR) {
                try {
                    const res = await authService.register(email);
                    if (res?.id) {
                        registerSession.start(res.id, { email, password });
                        signSession.clear();
                        navigate('/register');
                        return;
                    }
                } catch {
                    // Fallthrough to setError
                }
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (!signId) return;

        setLoading(true);
        setError(null);

        try {
            const data = await authService.confirmSign(signId, Number(code));
            if (!data?.token) {
                setError(t('error'));
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
            navigate('/');
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!signId) return;
        setLoading(true);
        try {
            await authService.resendSign(signId);
            notifications.show({
                title: t('resend'),
                message: t('resendSuccess'),
                color: 'blue',
            });
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleBackToStep1 = () => {
        signSession.clear();
        setStep(1);
        setError(null);
    };

    return (
        <Stack align="center" mt="xl">
            <Paper withBorder shadow="md" p="xl" radius="md" w="100%" maw={420}>
                <Title order={2} ta="center" mb="lg">
                    {step === 1 ? t('sign') : t('verify')}
                </Title>

                {error && (
                    <Alert color="red" mb="md" withCloseButton onClose={() => setError(null)}>
                        {error}{' '}
                    </Alert>
                )}

                {step === 1 ? (
                    <form onSubmit={handleSignSubmit}>
                        <Stack>
                            <TextInput
                                label={t('email')}
                                required
                                type="email"
                                placeholder={t('emailPlaceholder')}
                                value={email}
                                onChange={(e) => setEmail(e.currentTarget.value)}
                            />

                            <PasswordInput
                                label={t('password')}
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.currentTarget.value)}
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

                            <Button type="submit" fullWidth mt="md" loading={loading}>
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
                    <form onSubmit={handleCodeSubmit}>
                        <Stack align="center">
                            <Text size="sm" c="dimmed" ta="center">
                                {t('enterVerificationCodePrompt')}
                            </Text>

                            <PinInput length={6} type="number" value={code} onChange={setCode} size="md" autoFocus />

                            <Button type="submit" fullWidth mt="md" loading={loading} disabled={code.length < 6}>
                                {t('verify')}
                            </Button>

                            <Group justify="space-between" w="100%" mt="xs">
                                <Button variant="subtle" size="xs" onClick={handleBackToStep1}>
                                    {t('cancel')}
                                </Button>
                                <Button variant="subtle" size="xs" onClick={handleResend} loading={loading}>
                                    {t('resend')}
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                )}
            </Paper>
        </Stack>
    );
}
