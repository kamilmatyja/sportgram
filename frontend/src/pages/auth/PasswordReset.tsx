import { useState, type SyntheticEvent } from 'react';
import {
    Paper,
    Title,
    TextInput,
    PasswordInput,
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
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import { authService } from '../../api/services';
import { passwordResetSession, signSession } from '../../utils/authSession';

export default function PasswordReset() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [step, setStep] = useState<number>(passwordResetSession.step);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const resetId = passwordResetSession.id();

    const handleEmailSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setFieldErrors({});

        try {
            const data = await authService.passwordReset(email);
            if (!data?.id) {
                setError(t('error'));
                return;
            }

            passwordResetSession.start(data.id, { email });
            setStep(2);
        } catch (err) {
            const fe = extractFieldErrors(err);
            setFieldErrors(fe);
            if (Object.keys(fe).length === 0) {
                setError(getErrorMessage(err));
            } else {
                setError(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (!resetId) return;

        setLoading(true);
        setError(null);
        setFieldErrors({});

        try {
            await authService.confirmPasswordReset(resetId, {
                password,
                code: Number(code),
            });

            const storedEmail = passwordResetSession.get('email');
            passwordResetSession.clear();

            if (storedEmail) {
                try {
                    const signRes = await authService.sign({
                        email: storedEmail,
                        password,
                    });
                    if (signRes?.id) {
                        signSession.start(signRes.id);
                    }
                } catch {
                    // Fallthrough to sign navigation
                }
            }

            notifications.show({
                title: t('passwordReset'),
                message: t('passwordResetSuccess'),
                color: 'green',
            });
            navigate('/sign');
        } catch (err) {
            const fe = extractFieldErrors(err);
            setFieldErrors(fe);
            if (Object.keys(fe).length === 0) {
                setError(getErrorMessage(err));
            } else {
                setError(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!resetId) return;
        setLoading(true);
        try {
            await authService.resendPasswordReset(resetId);
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

    return (
        <Stack align="center" mt="xl">
            <Paper withBorder shadow="md" p="xl" radius="md" w="100%" maw={520}>
                <Title order={2} ta="center" mb="lg">
                    {step === 1 ? t('passwordReset') : `${t('passwordReset')} – ${t('verify')}`}
                </Title>

                {error && (
                    <Alert color="red" mb="md" withCloseButton onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

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
                                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                                }}
                            />

                            <Button type="submit" fullWidth mt="md" loading={loading}>
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
                    <form onSubmit={handleCodeSubmit}>
                        <Stack align="center">
                            <Text size="sm" c="dimmed" ta="center">
                                {t('enterResetCodeAndNewPassword')}
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

                            <PasswordInput
                                label={t('newPassword')}
                                required
                                placeholder="••••••••"
                                value={password}
                                error={fieldErrors.password || fieldErrors.newPassword}
                                onChange={(e) => {
                                    setPassword(e.currentTarget.value);
                                    if (fieldErrors.password || fieldErrors.newPassword) {
                                        const next = { ...fieldErrors };
                                        delete next.password;
                                        delete next.newPassword;
                                        setFieldErrors(next);
                                    }
                                }}
                                w="100%"
                            />

                            <Button
                                type="submit"
                                fullWidth
                                mt="md"
                                loading={loading}
                                disabled={code.length < 6 || !password}
                            >
                                {t('saveChanges')}
                            </Button>

                            <Group justify="space-between" w="100%" mt="xs">
                                <Button
                                    variant="subtle"
                                    size="xs"
                                    onClick={() => {
                                        passwordResetSession.clear();
                                        setStep(1);
                                    }}
                                >
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
