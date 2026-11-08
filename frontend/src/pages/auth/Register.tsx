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
    Text,
    SimpleGrid,
    Container,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import { authService, userService } from '../../api/services';
import { CountryEnum } from '../../enums/CountryEnum';
import { GenderEnum } from '../../enums/GenderEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { registerSession, signSession } from '../../utils/authSession';
import { AuthVerificationStep } from './AuthVerificationStep';

export default function Register() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [step, setStep] = useState<number>(registerSession.step);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        birthAt: '',
        gender: null as string | null,
        phone: '',
        country: null as string | null,
        roles: [] as string[],
    });

    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

    const canSubmit =
        formData.firstName.trim().length > 0 &&
        formData.lastName.trim().length > 0 &&
        formData.email.trim().length > 0 &&
        formData.password.length > 0 &&
        formData.birthAt.length > 0 &&
        formData.phone.trim().length > 0 &&
        formData.gender !== null &&
        formData.country !== null &&
        formData.roles.length > 0;

    const handleRegisterSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (!canSubmit || !formData.gender || !formData.country) return;

        setLoading(true);
        setFieldErrors({});

        try {
            await userService.createUserNano({
                body: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password,
                    birthAt: formData.birthAt,
                    gender: Number(formData.gender) as GenderEnum,
                    phone: Number(formData.phone) || 0,
                    country: Number(formData.country) as CountryEnum,
                    roles: formData.roles.map(Number) as RoleEnum[],
                },
            });

            const regData = await authService.register({ body: { email: formData.email } });
            if (!regData?.id) {
                notifications.show({ title: t('error'), message: t('error'), color: 'red' });
                return;
            }

            registerSession.start(regData.id, {
                email: formData.email,
                password: formData.password,
            });
            notifications.show({
                title: t('register'),
                message: t('enterRegisterCodePrompt'),
                color: 'green',
            });
            setStep(2);
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

    const handleCodeSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (!registerId) return;

        setLoading(true);
        setFieldErrors({});

        try {
            await authService.confirmRegister({
                params: { path: { id: registerId } },
                body: { code: Number(code) },
            });

            const email = registerSession.get('email');
            const password = registerSession.get('password');
            registerSession.clear();

            if (email && password) {
                try {
                    const signRes = await authService.sign({ body: { email, password } });
                    if (signRes?.id) {
                        signSession.start(signRes.id);
                    }
                } catch {
                    void 0;
                }
            }

            notifications.show({
                title: t('register'),
                message: t('registerSuccess'),
                color: 'green',
            });
            navigate('/sign');
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
        if (!registerId) return;
        setLoading(true);
        try {
            await authService.resendRegister({
                params: { path: { id: registerId } },
            });
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
                    {step === 1 ? t('register') : `${t('register')} – ${t('verify')}`}
                </Title>

                {step === 1 ? (
                    <form onSubmit={handleRegisterSubmit}>
                        <Stack gap="sm">
                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                                <TextInput
                                    label={t('firstName')}
                                    required
                                    value={formData.firstName}
                                    error={fieldErrors.firstName}
                                    onChange={(e) => {
                                        setFormData({ ...formData, firstName: e.currentTarget.value });
                                        if (fieldErrors.firstName) setFieldErrors({ ...fieldErrors, firstName: '' });
                                    }}
                                />
                                <TextInput
                                    label={t('lastName')}
                                    required
                                    value={formData.lastName}
                                    error={fieldErrors.lastName}
                                    onChange={(e) => {
                                        setFormData({ ...formData, lastName: e.currentTarget.value });
                                        if (fieldErrors.lastName) setFieldErrors({ ...fieldErrors, lastName: '' });
                                    }}
                                />
                            </SimpleGrid>

                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                                <TextInput
                                    label={t('email')}
                                    required
                                    type="email"
                                    placeholder={t('emailPlaceholder')}
                                    value={formData.email}
                                    error={fieldErrors.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.currentTarget.value });
                                        if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                                    }}
                                />

                                <PasswordInput
                                    label={t('password')}
                                    placeholder={t('passwordPlaceholder')}
                                    required
                                    value={password}
                                    error={fieldErrors.password}
                                    onChange={(e) => {
                                        setPassword(e.currentTarget.value);
                                        setFormData({ ...formData, password: e.currentTarget.value });
                                        if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                                    }}
                                />
                            </SimpleGrid>

                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                                <TextInput
                                    label={t('birthAt')}
                                    type="date"
                                    required
                                    value={formData.birthAt}
                                    error={fieldErrors.birthAt}
                                    onChange={(e) => {
                                        setFormData({ ...formData, birthAt: e.currentTarget.value });
                                        if (fieldErrors.birthAt) setFieldErrors({ ...fieldErrors, birthAt: '' });
                                    }}
                                />
                                <TextInput
                                    label={t('phone')}
                                    placeholder={t('phonePlaceholder')}
                                    required
                                    value={formData.phone}
                                    error={fieldErrors.phone}
                                    onChange={(e) => {
                                        setFormData({ ...formData, phone: e.currentTarget.value });
                                        if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
                                    }}
                                />
                            </SimpleGrid>

                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                                <Select
                                    label={t('gender')}
                                    placeholder={t('gender')}
                                    data={genderOptions}
                                    value={formData.gender}
                                    error={fieldErrors.gender}
                                    onChange={(val) => {
                                        setFormData({ ...formData, gender: val });
                                        if (fieldErrors.gender) setFieldErrors({ ...fieldErrors, gender: '' });
                                    }}
                                    required
                                    clearable
                                />
                                <Select
                                    label={t('country')}
                                    placeholder={t('country')}
                                    data={countryOptions}
                                    value={formData.country}
                                    error={fieldErrors.country}
                                    onChange={(val) => {
                                        setFormData({ ...formData, country: val });
                                        if (fieldErrors.country) setFieldErrors({ ...fieldErrors, country: '' });
                                    }}
                                    searchable
                                    required
                                    clearable
                                />
                            </SimpleGrid>

                            <MultiSelect
                                label={t('role')}
                                placeholder={t('role')}
                                data={roleOptions}
                                value={formData.roles}
                                error={fieldErrors.roles}
                                onChange={(val) => {
                                    setFormData({ ...formData, roles: val });
                                    if (fieldErrors.roles) setFieldErrors({ ...fieldErrors, roles: '' });
                                }}
                                required
                                clearable
                            />

                            <Button type="submit" fullWidth mt="md" loading={loading} disabled={loading || !canSubmit}>
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
                    <AuthVerificationStep
                        promptText={t('enterRegisterCodePrompt')}
                        code={code}
                        onCodeChange={(val) => {
                            setCode(val);
                            if (fieldErrors.code) setFieldErrors({ ...fieldErrors, code: '' });
                        }}
                        onSubmit={handleCodeSubmit}
                        onBack={() => {
                            registerSession.clear();
                            setStep(1);
                            setFieldErrors({});
                        }}
                        onResend={handleResend}
                        loading={loading}
                        error={fieldErrors.code}
                    />
                )}
            </Paper>
        </Container>
    );
}
