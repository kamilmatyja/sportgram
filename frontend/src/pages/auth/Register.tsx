import { useState, type SyntheticEvent } from 'react';
import {
    Paper,
    Title,
    TextInput,
    PasswordInput,
    Select,
    MultiSelect,
    Button,
    Stack,
    Anchor,
    Alert,
    Group,
    PinInput,
    Text,
    SimpleGrid,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { authService } from '../../api/services';
import { CountryEnum } from '../../enums/CountryEnum';
import { GenderEnum } from '../../enums/GenderEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { registerSession, signSession } from '../../utils/authSession';

export default function Register() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [step, setStep] = useState<number>(registerSession.step);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        birthAt: '2000-01-01',
        gender: '1',
        phone: '',
        country: '35', // Poland by default
        roles: ['1'], // Participant
    });

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const registerId = registerSession.id();

    const countryOptions = CountryEnum.getOptions(t).map((c) => ({
        value: String(c.value),
        label: c.label,
    }));

    const genderOptions = GenderEnum.getOptions(t).map((g) => ({
        value: String(g.value),
        label: g.label,
    }));

    const roleOptions = RoleEnum.getNanoOptions(t).map((r) => ({
        value: String(r.value),
        label: r.label,
    }));

    const handleRegisterSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await authService.registerNano({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                birthAt: formData.birthAt,
                gender: Number(formData.gender) as 1 | 2,
                phone: Number(formData.phone) || 0,
                country: Number(formData.country) as any,
                roles: formData.roles.map(Number),
            });

            const regData = await authService.register(formData.email);
            if (!regData?.id) {
                setError(t('error'));
                return;
            }

            registerSession.start(regData.id, {
                email: formData.email,
                password: formData.password,
            });
            setStep(2);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (!registerId) return;

        setLoading(true);
        setError(null);

        try {
            await authService.confirmRegister(registerId, Number(code));

            const email = registerSession.get('email');
            const password = registerSession.get('password');
            registerSession.clear();

            if (email && password) {
                try {
                    const signRes = await authService.sign({ email, password, rememberMe: false });
                    if (signRes?.id) {
                        signSession.start(signRes.id);
                    }
                } catch {
                    // Fallthrough to sign navigation
                }
            }

            notifications.show({
                title: t('register'),
                message: t('registerSuccess'),
                color: 'green',
            });
            navigate('/sign');
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!registerId) return;
        setLoading(true);
        try {
            await authService.resendRegister(registerId);
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
            <Paper withBorder shadow="md" p="xl" radius="md" w="100%" maw={540}>
                <Title order={2} ta="center" mb="lg">
                    {step === 1 ? t('register') : t('verify')}
                </Title>

                {error && (
                    <Alert color="red" mb="md" withCloseButton onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {step === 1 ? (
                    <form onSubmit={handleRegisterSubmit}>
                        <Stack gap="sm">
                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                                <TextInput
                                    label={t('firstName')}
                                    required
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.currentTarget.value })}
                                />
                                <TextInput
                                    label={t('lastName')}
                                    required
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.currentTarget.value })}
                                />
                            </SimpleGrid>

                            <TextInput
                                label={t('email')}
                                required
                                type="email"
                                placeholder={t('emailPlaceholder')}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.currentTarget.value })}
                            />

                            <PasswordInput
                                label={t('password')}
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.currentTarget.value })}
                            />

                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                                <TextInput
                                    label={t('birthAt')}
                                    type="date"
                                    required
                                    value={formData.birthAt}
                                    onChange={(e) => setFormData({ ...formData, birthAt: e.currentTarget.value })}
                                />
                                <TextInput
                                    label={t('phone')}
                                    required
                                    placeholder="123456789"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.currentTarget.value })}
                                />
                            </SimpleGrid>

                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                                <Select
                                    label={t('gender')}
                                    data={genderOptions}
                                    value={formData.gender}
                                    onChange={(val) => val && setFormData({ ...formData, gender: val })}
                                    required
                                />
                                <Select
                                    label={t('country')}
                                    data={countryOptions}
                                    value={formData.country}
                                    onChange={(val) => val && setFormData({ ...formData, country: val })}
                                    searchable
                                    required
                                />
                            </SimpleGrid>

                            <MultiSelect
                                label={t('role')}
                                data={roleOptions}
                                value={formData.roles}
                                onChange={(val) => setFormData({ ...formData, roles: val })}
                                required
                            />

                            <Button type="submit" fullWidth mt="md" loading={loading}>
                                {t('register')}
                            </Button>

                            <Text c="dimmed" size="xs" ta="center" mt="sm">
                                {t('alreadyHaveAccount')}{' '}
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
                                {t('enterRegisterCodePrompt')}
                            </Text>

                            <PinInput length={6} type="number" value={code} onChange={setCode} size="md" autoFocus />

                            <Button type="submit" fullWidth mt="md" loading={loading} disabled={code.length < 6}>
                                {t('verify')}
                            </Button>

                            <Group justify="space-between" w="100%" mt="xs">
                                <Button
                                    variant="subtle"
                                    size="xs"
                                    onClick={() => {
                                        registerSession.clear();
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
