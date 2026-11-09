import { useState, useEffect } from 'react';
import { Modal, Stack, Textarea, FileInput, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPhoto } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { storyService, type StoryResource } from '../../api/services';
import { useFormErrors } from '../../hooks';
import { resolveImageBase64 } from '../../utils';

export interface StoryModalProps {
    opened: boolean;
    onClose: () => void;
    story?: StoryResource | null;
    onSuccess?: (updatedStory?: StoryResource) => void;
}

export function StoryModal({ opened, onClose, story, onSuccess }: StoryModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { fieldErrors, handleFormError, clearFieldErrors } = useFormErrors();
    const isEdit = !!story;

    const [text, setText] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);

    useEffect(() => {
        if (!opened) return;
        setText(story?.text ?? '');
        setPhoto(null);
        clearFieldErrors();
    }, [opened, story, clearFieldErrors]);

    const mutation = useMutation({
        mutationFn: async () => {
            const photoStr = await resolveImageBase64(
                photo,
                story?.photo,
                isEdit ? undefined : `${t('photo')} ${t('required')}`,
            );
            const body = { text, photo: photoStr };

            if (isEdit) {
                const res = await storyService.updateStory({
                    params: { path: { id: story.id } },
                    body,
                });
                return {
                    ...story,
                    text,
                    photo: photoStr,
                    id: res?.id || story.id,
                };
            }
            return await storyService.createStory({ body });
        },
        onSuccess: (res) => {
            onClose();
            void queryClient.invalidateQueries({ queryKey: ['stories'] });
            void queryClient.invalidateQueries({ queryKey: ['user-stories'] });
            void queryClient.invalidateQueries({ queryKey: ['user-profile-stories'] });
            notifications.show({
                title: t('stories'),
                message: isEdit ? t('saved') : t('created'),
                color: 'green',
            });
            onSuccess?.(isEdit && res ? (res as StoryResource) : undefined);
        },
        onError: handleFormError,
    });

    const isSubmitting = mutation.isPending;
    const canSubmit = isEdit ? !!text.trim() : !!text.trim() && !!photo;

    return (
        <Modal opened={opened} onClose={onClose} title={isEdit ? t('editStory') : t('addStory')} zIndex={1000}>
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
                    {t('save')}
                </Button>
            </Stack>
        </Modal>
    );
}
