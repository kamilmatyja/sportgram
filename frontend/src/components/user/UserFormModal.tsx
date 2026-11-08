import { useState, useEffect } from 'react';
import { Modal, Stack, SimpleGrid, TextInput, Select, MultiSelect, Textarea, FileInput, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPhoto } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import { userService, type UserResource } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { CountryEnum } from '../../enums/CountryEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { GenderEnum } from '../../enums/GenderEnum';
import { LanguageEnum } from '../../enums/LanguageEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { ThemeEnum } from '../../enums/ThemeEnum';
import { resolveImageBase64 } from '../../utils/imageUtils';
import { slugify } from '../../utils/text';

export interface UserFormModalProps {
    opened: boolean;
    onClose: () => void;
    user?: UserResource | null;
    onSuccess?: () => void;
}

export function UserFormModal({ opened, onClose, user, onSuccess }: UserFormModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { refetchUser } = useAuth();
    const isEdit = !!user;

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [bgPhotoFile, setBgPhotoFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        link: '',
        phone: '',
        birthAt: '',
        gender: null as string | null,
        country: null as string | null,
        language: null as string | null,
        theme: null as string | null,
        color: null as string | null,
        bio: '',
        roles: [] as string[],
        disciplines: [] as string[],
    });

    useEffect(() => {
        if (!opened) return;

        if (user) {
            setFormData({
                firstName: user.firstName ?? '',
                lastName: user.lastName ?? '',
                email: user.email ?? '',
                password: '',
                link: user.link ?? '',
                phone: user.phone != null ? String(user.phone) : '',
                birthAt: user.birthAt ? user.birthAt.split('T')[0] : '',
                gender: user.gender != null ? String(user.gender) : null,
                country: user.country != null ? String(user.country) : null,
                language: user.language != null ? String(user.language) : null,
                theme: user.theme != null ? String(user.theme) : null,
                color: user.color != null ? String(user.color) : null,
                bio: user.bio ?? '',
                roles: user.roles?.map((r) => String(r.role)) ?? [],
                disciplines: user.disciplines?.map((d) => String(d.discipline)) ?? [],
            });
        } else {
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                link: '',
                phone: '',
                birthAt: '',
                gender: null,
                country: null,
                language: null,
                theme: null,
                color: null,
                bio: '',
                roles: [],
                disciplines: [],
            });
        }
        setProfilePhotoFile(null);
        setBgPhotoFile(null);
        setFieldErrors({});
    }, [opened, user]);

    const mutation = useMutation({
        mutationFn: async () => {
            const profPhoto = await resolveImageBase64(
                profilePhotoFile,
                user?.profilePhoto,
                isEdit ? undefined : t('selectPhoto'),
            );
            const bgPhoto = await resolveImageBase64(
                bgPhotoFile,
                user?.backgroundPhoto,
                isEdit ? undefined : t('selectPhoto'),
            );

            if (isEdit) {
                await userService.updateUser({
                    params: { path: { id: user.id } },
                    body: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        bio: formData.bio,
                        phone: Number(formData.phone) || 0,
                        country: Number(formData.country) as CountryEnum,
                        gender: Number(formData.gender) as GenderEnum,
                        birthAt: formData.birthAt,
                        theme: Number(formData.theme) as ThemeEnum,
                        language: Number(formData.language) as LanguageEnum,
                        color: Number(formData.color) as ColorEnum,
                        link: formData.link,
                        password: formData.password || null,
                        email: formData.email,
                        profilePhoto: profPhoto,
                        backgroundPhoto: bgPhoto,
                        disciplines: formData.disciplines.map(Number),
                        roles: formData.roles.map(Number),
                    },
                });
            } else {
                if (
                    !formData.bio.trim() ||
                    !formData.language ||
                    !formData.theme ||
                    !formData.color ||
                    formData.roles.length === 0
                ) {
                    throw new Error(t('error'));
                }

                await userService.createUser({
                    body: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.email,
                        password: formData.password,
                        link: formData.link,
                        phone: Number(formData.phone) || 0,
                        birthAt: formData.birthAt,
                        gender: Number(formData.gender) as 1 | 2,
                        country: Number(formData.country) as CountryEnum,
                        language: Number(formData.language) as 1 | 2,
                        theme: Number(formData.theme) as 1 | 2,
                        color: Number(formData.color) as ColorEnum,
                        bio: formData.bio,
                        profilePhoto: profPhoto,
                        backgroundPhoto: bgPhoto,
                        roles: formData.roles.map(Number) as RoleEnum[],
                        disciplines: formData.disciplines.map(Number) as DisciplineEnum[],
                    },
                });
            }
        },
        onSuccess: () => {
            onClose();
            queryClient.invalidateQueries({ queryKey: ['users'] });
            if (isEdit) {
                queryClient.invalidateQueries({ queryKey: ['user', user.link] });
                queryClient.invalidateQueries({ queryKey: ['user', formData.link] });
                refetchUser();
                notifications.show({ title: t('users'), message: t('userUpdated'), color: 'green' });
            } else {
                notifications.show({ title: t('users'), message: t('userCreated'), color: 'green' });
            }
            onSuccess?.();
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const isSubmitting = mutation.isPending;
    const canSubmit = isEdit
        ? !!formData.firstName.trim() &&
          !!formData.lastName.trim() &&
          !!formData.email.trim() &&
          !!formData.link.trim() &&
          !!formData.phone.trim() &&
          !!formData.birthAt &&
          !!formData.gender &&
          !!formData.country &&
          !!formData.language &&
          !!formData.theme &&
          !!formData.color &&
          !!formData.bio.trim() &&
          formData.roles.length > 0
        : !!formData.firstName.trim() &&
          !!formData.lastName.trim() &&
          !!formData.email.trim() &&
          !!formData.password.trim() &&
          !!formData.link.trim() &&
          !!formData.phone.trim() &&
          !!formData.birthAt &&
          !!formData.gender &&
          !!formData.country &&
          !!formData.language &&
          !!formData.theme &&
          !!formData.color &&
          !!formData.bio.trim() &&
          formData.roles.length > 0 &&
          !!profilePhotoFile &&
          !!bgPhotoFile;

    return (
        <Modal opened={opened} onClose={onClose} title={isEdit ? t('edit') : t('add')}>
            <Stack gap="sm">
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    <TextInput
                        label={t('firstName')}
                        required
                        value={formData.firstName}
                        error={fieldErrors.firstName}
                        onChange={(e) => {
                            const val = e.currentTarget.value;
                            const prevGenerated = slugify(`${formData.firstName}-${formData.lastName}`);
                            const nextGenerated = slugify(`${val}-${formData.lastName}`);
                            if (!isEdit && (!formData.link || formData.link === prevGenerated)) {
                                setFormData({ ...formData, firstName: val, link: nextGenerated });
                            } else {
                                setFormData({ ...formData, firstName: val });
                            }
                        }}
                    />
                    <TextInput
                        label={t('lastName')}
                        required
                        value={formData.lastName}
                        error={fieldErrors.lastName}
                        onChange={(e) => {
                            const val = e.currentTarget.value;
                            const prevGenerated = slugify(`${formData.firstName}-${formData.lastName}`);
                            const nextGenerated = slugify(`${formData.firstName}-${val}`);
                            if (!isEdit && (!formData.link || formData.link === prevGenerated)) {
                                setFormData({ ...formData, lastName: val, link: nextGenerated });
                            } else {
                                setFormData({ ...formData, lastName: val });
                            }
                        }}
                    />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    <TextInput
                        label={t('email')}
                        placeholder={t('emailPlaceholder')}
                        required
                        type="email"
                        value={formData.email}
                        error={fieldErrors.email}
                        onChange={(e) => setFormData({ ...formData, email: e.currentTarget.value })}
                    />
                    <TextInput
                        label={t('password')}
                        placeholder={isEdit ? t('leaveEmptyToKeep') : t('passwordPlaceholder')}
                        required={!isEdit}
                        type="password"
                        value={formData.password}
                        error={fieldErrors.password}
                        onChange={(e) => setFormData({ ...formData, password: e.currentTarget.value })}
                    />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    <TextInput
                        label={t('link')}
                        required
                        value={formData.link}
                        error={fieldErrors.link}
                        onChange={(e) => setFormData({ ...formData, link: e.currentTarget.value })}
                    />
                    <TextInput
                        label={t('phone')}
                        placeholder={t('phonePlaceholder')}
                        required
                        value={formData.phone}
                        error={fieldErrors.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.currentTarget.value })}
                    />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    <TextInput
                        label={t('birthAt')}
                        type="date"
                        required
                        value={formData.birthAt}
                        error={fieldErrors.birthAt}
                        onChange={(e) => setFormData({ ...formData, birthAt: e.currentTarget.value })}
                    />
                    <Select
                        label={t('gender')}
                        placeholder={t('gender')}
                        required
                        clearable
                        data={GenderEnum.getOptions(t).map((g) => ({ value: String(g.value), label: g.label }))}
                        value={formData.gender}
                        error={fieldErrors.gender}
                        onChange={(val) => setFormData({ ...formData, gender: val })}
                    />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    <Select
                        label={t('country')}
                        placeholder={t('country')}
                        required
                        clearable
                        data={CountryEnum.getOptions(t).map((c) => ({ value: String(c.value), label: c.label }))}
                        value={formData.country}
                        error={fieldErrors.country}
                        onChange={(val) => setFormData({ ...formData, country: val })}
                        searchable
                    />
                    <Select
                        label={t('language')}
                        placeholder={t('language')}
                        required
                        clearable
                        data={LanguageEnum.getOptions(t).map((l) => ({ value: String(l.value), label: l.label }))}
                        value={formData.language}
                        error={fieldErrors.language}
                        onChange={(val) => setFormData({ ...formData, language: val })}
                    />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    <Select
                        label={t('theme')}
                        placeholder={t('theme')}
                        required
                        clearable
                        data={ThemeEnum.getOptions(t).map((th) => ({ value: String(th.value), label: th.label }))}
                        value={formData.theme}
                        error={fieldErrors.theme}
                        onChange={(val) => setFormData({ ...formData, theme: val })}
                    />
                    <Select
                        label={t('color')}
                        placeholder={t('color')}
                        required
                        clearable
                        data={ColorEnum.getOptions(t).map((cl) => ({ value: String(cl.value), label: cl.label }))}
                        value={formData.color}
                        error={fieldErrors.color}
                        onChange={(val) => setFormData({ ...formData, color: val })}
                    />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    <MultiSelect
                        label={t('role')}
                        placeholder={t('role')}
                        required
                        clearable
                        data={RoleEnum.getOptions(t).map((r) => ({ value: String(r.value), label: r.label }))}
                        value={formData.roles}
                        error={fieldErrors.roles}
                        onChange={(val) => setFormData({ ...formData, roles: val })}
                    />
                    <MultiSelect
                        label={t('disciplinesLabel')}
                        placeholder={t('disciplinesLabel')}
                        clearable
                        data={DisciplineEnum.getStringOptions(t)}
                        value={formData.disciplines}
                        error={fieldErrors.disciplines}
                        onChange={(val) => setFormData({ ...formData, disciplines: val })}
                    />
                </SimpleGrid>

                <Textarea
                    label={t('bio')}
                    required
                    rows={3}
                    minRows={3}
                    value={formData.bio}
                    error={fieldErrors.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.currentTarget.value })}
                />

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    <FileInput
                        label={t('profilePhoto')}
                        placeholder={t('selectPhoto')}
                        description={isEdit ? t('leaveEmptyToKeep') : undefined}
                        required={!isEdit}
                        accept="image/*"
                        leftSection={<IconPhoto size={16} />}
                        value={profilePhotoFile}
                        error={fieldErrors.profilePhoto}
                        onChange={setProfilePhotoFile}
                        clearable
                    />
                    <FileInput
                        label={t('backgroundPhoto')}
                        placeholder={t('selectPhoto')}
                        description={isEdit ? t('leaveEmptyToKeep') : undefined}
                        required={!isEdit}
                        accept="image/*"
                        leftSection={<IconPhoto size={16} />}
                        value={bgPhotoFile}
                        error={fieldErrors.backgroundPhoto}
                        onChange={setBgPhotoFile}
                        clearable
                    />
                </SimpleGrid>

                <Button
                    loading={isSubmitting}
                    disabled={isSubmitting || !canSubmit}
                    onClick={() => mutation.mutate()}
                    mt="sm"
                >
                    {isEdit ? t('save') : t('add')}
                </Button>
            </Stack>
        </Modal>
    );
}
