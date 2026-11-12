import { useState, useEffect } from 'react';
import { Stack, Textarea, Button } from '@mantine/core';
import { InteractionModal as Modal } from '../common/InteractionModal';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { feedService, type FeedResource } from '../../api/services';
import { ImageInput } from '../common';
import { useFormErrors } from '../../hooks';
import { resolveImageBase64 } from '../../utils';

export interface FeedModalProps {
    opened: boolean;
    onClose: () => void;
    feed?: FeedResource | null;
    onSuccess?: () => void;
}

export function FeedModal({ opened, onClose, feed, onSuccess }: FeedModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { fieldErrors, handleFormError, clearFieldErrors } = useFormErrors();
    const isEdit = !!feed;

    const [text, setText] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);

    useEffect(() => {
        if (!opened) return;
        setText(feed?.text ?? '');
        setPhoto(null);
        clearFieldErrors();
    }, [opened, feed, clearFieldErrors]);

    const mutation = useMutation({
        mutationFn: async () => {
            const photoStr = await resolveImageBase64(
                photo,
                feed?.photo,
                isEdit ? undefined : `${t('photo')} ${t('required')}`,
            );
            const body = { text, photo: photoStr };

            if (isEdit) {
                await feedService.updateFeed({ params: { path: { id: feed.id } }, body });
            } else {
                await feedService.createFeed({ body });
            }
        },
        onSuccess: () => {
            onClose();
            void queryClient.invalidateQueries({ queryKey: ['feeds'] });
            void queryClient.invalidateQueries({ queryKey: ['user-feeds'] });
            void queryClient.invalidateQueries({ queryKey: ['user-profile-feeds'] });
            notifications.show({
                title: t('feeds'),
                message: isEdit ? t('saved') : t('created'),
                color: 'green',
            });
            onSuccess?.();
        },
        onError: handleFormError,
    });

    const isSubmitting = mutation.isPending;
    const hasExistingPhoto = isEdit && !!feed?.photo;
    const isPhotoRequired = !hasExistingPhoto;
    const canSubmit = isPhotoRequired ? !!text.trim() && !!photo : !!text.trim();

    return (
        <Modal opened={opened} onClose={onClose} title={isEdit ? t('editFeed') : t('addFeed')}>
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
                <ImageInput
                    label={t('photo')}
                    description={hasExistingPhoto ? t('leaveEmptyToKeep') : undefined}
                    value={photo}
                    error={fieldErrors.photo}
                    onChange={setPhoto}
                    required={isPhotoRequired}
                />
                <Button loading={isSubmitting} disabled={isSubmitting || !canSubmit} onClick={() => mutation.mutate()}>
                    {t('save')}
                </Button>
            </Stack>
        </Modal>
    );
}
