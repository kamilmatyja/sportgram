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
    PinInput,
    Text,
    Container,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
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
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const signId = signSession.id();

    const handleSignSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        setFieldErrors({});

        try {
            const data = await authService.sign({ email, password });
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
            const fe = extractFieldErrors(apiErr);
            setFieldErrors(fe);
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
                    // Fallthrough to notifications
                }
            }
            if (Object.keys(fe).length === 0) {
                notifications.show({ title: t('error'), message: msg, color: 'red' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (!signId) return;

        setLoading(true);
        setFieldErrors({});

        try {
            const data = await authService.confirmSign(signId, Number(code));
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
            navigate('/');
        } catch (err) {
            const fe = extractFieldErrors(err);
            setFieldErrors(fe);
            if (Object.keys(fe).length === 0) {
                notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
            }
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
        setFieldErrors({});
    };

    return (
        <Container size="xs" py="xl">
            <Paper withBorder shadow="sm" p="xl" radius="md">
                <Title order={2} ta="center" mb="lg">
                    {step === 1 ? t('sign') : `${t('sign')} – ${t('verify')}`}
                </Title>

                {step === 1 ? (
                    <form onSubmit={handleSignSubmit}>
                        <Stack gap="md">
                            <TextInput
                                label={t('email')}
                                required
                                type="email"
                                placeholder={t('emailPlaceholder')}
                                value={email}
                                error={fieldErrors.email}
                                onChange={(e) => {
                                    setEmail(e.currentTarget.value);
                                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
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
                                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
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

                            <Button type="submit" fullWidth mt="md" loading={loading} disabled={loading}>
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
                        <Stack align="center" gap="md">
                            <Text size="sm" c="dimmed" ta="center">
                                {t('enterVerificationCodePrompt')}
                            </Text>

                            <PinInput
                                length={6}
                                type="number"
                                value={code}
                                onChange={(val) => {
                                    setCode(val);
                                    if (fieldErrors.code) setFieldErrors({ ...fieldErrors, code: '' });
                                }}
                                error={!!fieldErrors.code}
                                size="md"
                                autoFocus
                            />

                            {fieldErrors.code && (
                                <Text size="xs" c="red" ta="center">
                                    {fieldErrors.code}
                                </Text>
                            )}

                            <Button
                                type="submit"
                                fullWidth
                                mt="md"
                                loading={loading}
                                disabled={loading || code.length < 6}
                            >
                                {t('verify')}
                            </Button>

                            <Group justify="space-between" w="100%" mt="xs">
                                <Button variant="subtle" size="xs" onClick={handleBackToStep1} disabled={loading}>
                                    {t('cancel')}
                                </Button>
                                <Button
                                    variant="subtle"
                                    size="xs"
                                    onClick={handleResend}
                                    loading={loading}
                                    disabled={loading}
                                >
                                    {t('resend')}
                                </Button>
                            </Group>
                        </Stack>
                    </form>
                )}
            </Paper>
        </Container>
    );
}
