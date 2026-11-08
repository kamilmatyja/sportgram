import { useState, useEffect } from 'react';
import { Modal, Stack, Textarea, FileInput, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPhoto } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import { storyService, type StoryResource } from '../../api/services';
import { resolveImageBase64 } from '../../utils/imageUtils';

export interface StoryModalProps {
    opened: boolean;
    onClose: () => void;
    story?: StoryResource | null;
    onSuccess?: (updatedStory?: StoryResource) => void;
}

export function StoryModal({ opened, onClose, story, onSuccess }: StoryModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const isEdit = !!story;

    const [text, setText] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!opened) return;
        if (story) {
            setText(story.text ?? '');
        } else {
            setText('');
        }
        setPhoto(null);
        setFieldErrors({});
    }, [opened, story]);

    const mutation = useMutation({
        mutationFn: async () => {
            const photoStr = await resolveImageBase64(
                photo,
                story?.photo,
                isEdit ? undefined : t('photo') + ' ' + t('required'),
            );
            if (isEdit) {
                const res = await storyService.updateStory({
                    params: { path: { id: story.id } },
                    body: { text, photo: photoStr },
                });
                return {
                    ...story,
                    text,
                    photo: photoStr,
                    id: res?.id || story.id,
                };
            } else {
                return await storyService.createStory({
                    body: { text, photo: photoStr },
                });
            }
        },
        onSuccess: (res) => {
            onClose();
            queryClient.invalidateQueries({ queryKey: ['stories'] });
            queryClient.invalidateQueries({ queryKey: ['user-stories'] });
            queryClient.invalidateQueries({ queryKey: ['user-profile-stories'] });
            notifications.show({
                title: t('stories'),
                message: isEdit ? t('storyUpdated') : t('storyAdded'),
                color: 'green',
            });
            onSuccess?.(isEdit && res ? (res as StoryResource) : undefined);
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const isSubmitting = mutation.isPending;
    const canSubmit = isEdit ? !!text.trim() : !!text.trim() && !!photo;

    return (
        <Modal opened={opened} onClose={onClose} title={isEdit ? t('edit') : t('add')} zIndex={1000}>
            <Stack gap="sm">
                <Textarea
                    label={t('text')}
                    rows={3}
                    minRows={3}
                    value={text}
                    error={fieldErrors.text}
                    onChange={(e) => setText(e.currentTarget.value)}
                    required
                />
                <FileInput
                    label={t('photo')}
                    placeholder={t('selectPhoto')}
                    description={isEdit ? t('leaveEmptyToKeep') : undefined}
                    accept="image/*"
                    leftSection={<IconPhoto size={16} />}
                    value={photo}
                    error={fieldErrors.photo}
                    onChange={setPhoto}
                    clearable
                    required={!isEdit}
                />
                <Button loading={isSubmitting} disabled={isSubmitting || !canSubmit} onClick={() => mutation.mutate()}>
                    {isEdit ? t('save') : t('add')}
                </Button>
            </Stack>
        </Modal>
    );
}
