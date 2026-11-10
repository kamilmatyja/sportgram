import { useState, useEffect } from 'react';
import { Modal, Stack, TextInput, Textarea, Select, MultiSelect, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ImageInput } from '../common';
import { pageService, type PageResource } from '../../api/services';
import { useAuth } from '../../auth';
import { ColorEnum } from '../../enums/ColorEnum';
import { useFormErrors } from '../../hooks';
import { resolveImageBase64, updateTitleWithSlug } from '../../utils';

export interface PageFormModalProps {
    opened: boolean;
    onClose: () => void;
    page?: PageResource | null;
    collaboratorOptions?: { value: string; label: string }[];
    onSuccess?: () => void;
}

const INITIAL_FORM_DATA = {
    title: '',
    description: '',
    link: '',
    color: null as string | null,
};

export function PageFormModal({ opened, onClose, page, collaboratorOptions = [], onSuccess }: PageFormModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();
    const { fieldErrors, handleFormError, clearFieldErrors } = useFormErrors();
    const isEdit = !!page;

    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [bgPhotoFile, setBgPhotoFile] = useState<File | null>(null);
    const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);

    useEffect(() => {
        if (!opened) return;
        if (page) {
            setFormData({
                title: page.title ?? '',
                description: page.description ?? '',
                link: page.link ?? '',
                color: page.color != null ? String(page.color) : null,
            });

            const collabs = page.participants?.filter((p) => p.userId !== page.userId).map((p) => p.userId) ?? [];
            setCollaboratorIds(collabs);
        } else {
            setFormData(INITIAL_FORM_DATA);
            setCollaboratorIds([]);
        }
        setProfilePhotoFile(null);
        setBgPhotoFile(null);
        clearFieldErrors();
    }, [opened, page, clearFieldErrors]);

    const mutation = useMutation({
        mutationFn: async () => {
            const profPhoto = await resolveImageBase64(
                profilePhotoFile,
                page?.profilePhoto,
                isEdit ? undefined : t('selectPhoto'),
            );
            const bgPhoto = await resolveImageBase64(
                bgPhotoFile,
                page?.backgroundPhoto,
                isEdit ? undefined : t('selectPhoto'),
            );

            const baseUserId = isEdit ? page.userId : currentUser?.id;
            const userIds = Array.from(new Set([baseUserId, ...collaboratorIds].filter(Boolean))) as string[];

            const body = {
                title: formData.title,
                description: formData.description,
                link: formData.link,
                color: (formData.color ? Number(formData.color) : 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
                profilePhoto: profPhoto,
                backgroundPhoto: bgPhoto,
                userIds,
            };

            if (isEdit) {
                await pageService.updatePage({ params: { path: { id: page.id } }, body });
            } else {
                await pageService.createPage({ body });
            }
        },
        onSuccess: () => {
            onClose();
            void queryClient.invalidateQueries({ queryKey: ['pages'] });
            void queryClient.invalidateQueries({ queryKey: ['user-pages'] });
            if (isEdit) {
                void queryClient.invalidateQueries({ queryKey: ['page', page.link] });
                void queryClient.invalidateQueries({ queryKey: ['page', formData.link] });
            }
            notifications.show({
                title: t('pages'),
                message: isEdit ? t('saved') : t('created'),
                color: 'green',
            });
            onSuccess?.();
        },
        onError: handleFormError,
    });

    const isSubmitting = mutation.isPending;
    const canSubmit = isEdit
        ? !!formData.title.trim() && !!formData.description.trim() && !!formData.link.trim() && !!formData.color
        : !!formData.title.trim() &&
          !!formData.description.trim() &&
          !!formData.link.trim() &&
          !!formData.color &&
          !!profilePhotoFile &&
          !!bgPhotoFile;

    return (
        <Modal opened={opened} onClose={onClose} title={isEdit ? t('editPage') : t('addPage')}>
            <Stack gap="sm">
                <TextInput
                    label={t('title')}
                    required
                    value={formData.title}
                    error={fieldErrors.title}
                    onChange={(e) => setFormData(updateTitleWithSlug(formData, e.currentTarget.value, isEdit))}
                />

                <Textarea
                    label={t('description')}
                    required
                    rows={3}
                    minRows={3}
                    value={formData.description}
                    error={fieldErrors.description}
                    onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
                />

                <TextInput
                    label={t('link')}
                    required
                    value={formData.link}
                    error={fieldErrors.link}
                    onChange={(e) => setFormData({ ...formData, link: e.currentTarget.value })}
                />

                <Select
                    label={t('color')}
                    placeholder={t('color')}
                    required
                    data={ColorEnum.getOptions(t).map((c) => ({
                        value: String(c.value),
                        label: c.label,
                    }))}
                    value={formData.color}
                    error={fieldErrors.color}
                    onChange={(val) => setFormData({ ...formData, color: val })}
                    clearable
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

                {collaboratorOptions.length > 0 && (
                    <MultiSelect
                        label={t('collaborators')}
                        placeholder={t('selectCollaborators')}
                        data={collaboratorOptions}
                        value={collaboratorIds}
                        onChange={setCollaboratorIds}
                        searchable
                        clearable
                    />
                )}

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
