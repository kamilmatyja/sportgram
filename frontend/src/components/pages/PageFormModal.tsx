import { useState, useEffect } from 'react';
import { Modal, Stack, TextInput, Textarea, Select, FileInput, SimpleGrid, MultiSelect, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPhoto } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import { pageService, type PageResource } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { resolveImageBase64 } from '../../utils/imageUtils';

export interface PageFormModalProps {
    opened: boolean;
    onClose: () => void;
    page?: PageResource | null;
    collaboratorOptions?: { value: string; label: string }[];
    onSuccess?: () => void;
}

export function PageFormModal({ opened, onClose, page, collaboratorOptions = [], onSuccess }: PageFormModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();
    const isEdit = !!page;

    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [bgPhotoFile, setBgPhotoFile] = useState<File | null>(null);
    const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        link: '',
        color: null as string | null,
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
            setFormData({
                title: '',
                description: '',
                link: '',
                color: null,
            });
            setCollaboratorIds([]);
        }
        setProfilePhotoFile(null);
        setBgPhotoFile(null);
        setFieldErrors({});
    }, [opened, page]);

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
            const resolvedUserIds = baseUserId
                ? Array.from(new Set([baseUserId, ...collaboratorIds]))
                : collaboratorIds;

            const payload = {
                title: formData.title,
                description: formData.description,
                link: formData.link,
                color: (formData.color ? Number(formData.color) : 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
                profilePhoto: profPhoto,
                backgroundPhoto: bgPhoto,
                userIds: resolvedUserIds,
            };

            if (isEdit) {
                await pageService.updatePage({
                    params: { path: { id: page.id } },
                    body: payload,
                });
            } else {
                await pageService.createPage({
                    body: payload,
                });
            }
        },
        onSuccess: () => {
            onClose();
            queryClient.invalidateQueries({ queryKey: ['pages'] });
            queryClient.invalidateQueries({ queryKey: ['user-pages'] });
            if (isEdit) {
                queryClient.invalidateQueries({ queryKey: ['page', page.link] });
                queryClient.invalidateQueries({ queryKey: ['page', formData.link] });
            }
            notifications.show({
                title: t('pages'),
                message: isEdit ? t('pageUpdated') : t('pageCreated'),
                color: 'green',
            });
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
        ? !!formData.title.trim() && !!formData.description.trim() && !!formData.link.trim()
        : !!formData.title.trim() &&
          !!formData.description.trim() &&
          !!formData.link.trim() &&
          !!profilePhotoFile &&
          !!bgPhotoFile;

    return (
        <Modal opened={opened} onClose={onClose} title={isEdit ? t('editPage') : t('addPage')} size="lg">
            <Stack gap="sm">
                <TextInput
                    label={t('title')}
                    required
                    value={formData.title}
                    error={fieldErrors.title}
                    onChange={(e) => {
                        const val = e.currentTarget.value;
                        if (!isEdit && !formData.link) {
                            const generatedLink = val
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)/g, '');
                            setFormData({ ...formData, title: val, link: generatedLink });
                        } else {
                            setFormData({ ...formData, title: val });
                        }
                    }}
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
                    {isEdit ? t('save') : t('add')}
                </Button>
            </Stack>
        </Modal>
    );
}
