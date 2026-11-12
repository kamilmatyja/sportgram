import { useState, useEffect } from 'react';
import { Stack, TextInput, Select, MultiSelect, Textarea, Button, SimpleGrid } from '@mantine/core';
import { InteractionModal as Modal } from '../common/InteractionModal';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ImageInput } from '../common';
import { userService, type UserResource } from '../../api/services';
import { useAuth } from '../../auth';
import { ColorEnum } from '../../enums/ColorEnum';
import { CountryEnum } from '../../enums/CountryEnum';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { GenderEnum } from '../../enums/GenderEnum';
import { LanguageEnum } from '../../enums/LanguageEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { ThemeEnum } from '../../enums/ThemeEnum';
import { useFormErrors } from '../../hooks';
import { resolveImageBase64 } from '../../utils';
import { slugify } from '../../utils';

export interface UserFormModalProps {
    opened: boolean;
    onClose: () => void;
    user?: UserResource | null;
    onSuccess?: () => void;
}

const INITIAL_FORM_DATA = {
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
};

export function UserFormModal({ opened, onClose, user, onSuccess }: UserFormModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { refetchUser } = useAuth();
    const { fieldErrors, handleFormError, clearFieldErrors } = useFormErrors();
    const isEdit = !!user;

    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [bgPhotoFile, setBgPhotoFile] = useState<File | null>(null);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);

    const { data: userDetails } = useQuery({
        queryKey: ['user-modal-details', user?.id],
        queryFn: () =>
            userService.getUser({
                params: {
                    path: { id: user!.id },
                    query: { 'include[]': ['userDisciplines', 'userRoles'] },
                },
            }),
        enabled: opened && !!user?.id && (user.roles === undefined || user.disciplines === undefined),
    });

    useEffect(() => {
        if (!opened) return;

        const effectiveUser = userDetails?.data ?? user;

        if (effectiveUser) {
            setFormData({
                firstName: effectiveUser.firstName ?? '',
                lastName: effectiveUser.lastName ?? '',
                email: effectiveUser.email ?? '',
                password: '',
                link: effectiveUser.link ?? '',
                phone: effectiveUser.phone != null ? String(effectiveUser.phone) : '',
                birthAt: effectiveUser.birthAt ? effectiveUser.birthAt.split('T')[0] : '',
                gender: effectiveUser.gender != null ? String(effectiveUser.gender) : null,
                country: effectiveUser.country != null ? String(effectiveUser.country) : null,
                language: effectiveUser.language != null ? String(effectiveUser.language) : null,
                theme: effectiveUser.theme != null ? String(effectiveUser.theme) : null,
                color: effectiveUser.color != null ? String(effectiveUser.color) : null,
                bio: effectiveUser.bio ?? '',
                roles: effectiveUser.roles?.map((r) => String(r.role)) ?? [],
                disciplines: effectiveUser.disciplines?.map((d) => String(d.discipline)) ?? [],
            });
        } else {
            setFormData(INITIAL_FORM_DATA);
        }
        setProfilePhotoFile(null);
        setBgPhotoFile(null);
        clearFieldErrors();
    }, [opened, user, userDetails, clearFieldErrors]);

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

            const body = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                link: formData.link,
                phone: Number(formData.phone) || 0,
                birthAt: formData.birthAt,
                gender: Number(formData.gender) as GenderEnum,
                country: Number(formData.country) as CountryEnum,
                language: Number(formData.language) as LanguageEnum,
                theme: Number(formData.theme) as ThemeEnum,
                color: Number(formData.color) as ColorEnum,
                bio: formData.bio,
                profilePhoto: profPhoto,
                backgroundPhoto: bgPhoto,
                roles: formData.roles.map(Number) as RoleEnum[],
                disciplines: formData.disciplines.map(Number) as DisciplineEnum[],
            };

            if (isEdit) {
                await userService.updateUser({
                    params: { path: { id: user.id } },
                    body: { ...body, password: formData.password || null },
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
                    body: { ...body, password: formData.password },
                });
            }
        },
        onSuccess: () => {
            onClose();
            void queryClient.invalidateQueries({ queryKey: ['users'] });
            if (isEdit) {
                void queryClient.invalidateQueries({ queryKey: ['user', user.link] });
                void queryClient.invalidateQueries({ queryKey: ['user', formData.link] });
                void refetchUser();
            }
            notifications.show({
                title: t('users'),
                message: isEdit ? t('saved') : t('created'),
                color: 'green',
            });
            onSuccess?.();
        },
        onError: handleFormError,
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
        <Modal opened={opened} onClose={onClose} title={isEdit ? t('editUser') : t('addUser')}>
            <Stack gap="sm">
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" w="100%">
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

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" w="100%">
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

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" w="100%">
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

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" w="100%">
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

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" w="100%">
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

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" w="100%">
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

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" w="100%">
                    <MultiSelect
                        label={t('roles')}
                        placeholder={t('roles')}
                        required
                        clearable
                        data={RoleEnum.getOptions(t).map((r) => ({ value: String(r.value), label: r.label }))}
                        value={formData.roles}
                        error={fieldErrors.roles}
                        onChange={(val) => setFormData({ ...formData, roles: val })}
                    />
                    <MultiSelect
                        label={t('disciplines')}
                        placeholder={t('disciplines')}
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

                <ImageInput
                    label={t('profilePhoto')}
                    description={isEdit ? t('leaveEmptyToKeep') : undefined}
                    required={!isEdit}
                    value={profilePhotoFile}
                    error={fieldErrors.profilePhoto}
                    onChange={setProfilePhotoFile}
                />
                <ImageInput
                    label={t('backgroundPhoto')}
                    description={isEdit ? t('leaveEmptyToKeep') : undefined}
                    required={!isEdit}
                    value={bgPhotoFile}
                    error={fieldErrors.backgroundPhoto}
                    onChange={setBgPhotoFile}
                />

                <Button
                    loading={isSubmitting}
                    disabled={isSubmitting || !canSubmit}
                    onClick={() => mutation.mutate()}
                    mt="sm"
                >
                    {t('save')}
                </Button>
            </Stack>
        </Modal>
    );
}
