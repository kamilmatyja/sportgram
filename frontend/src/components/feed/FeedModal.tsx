import { useState, useEffect } from 'react';
import { Modal, Stack, Textarea, FileInput, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPhoto } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import { feedService, type FeedResource } from '../../api/services';
import { resolveImageBase64 } from '../../utils/imageUtils';

export interface FeedModalProps {
    opened: boolean;
    onClose: () => void;
    feed?: FeedResource | null;
    onSuccess?: () => void;
}

export function FeedModal({ opened, onClose, feed, onSuccess }: FeedModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const isEdit = !!feed;

    const [text, setText] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!opened) return;
        if (feed) {
            setText(feed.text ?? '');
        } else {
            setText('');
        }
        setPhoto(null);
        setFieldErrors({});
    }, [opened, feed]);

    const mutation = useMutation({
        mutationFn: async () => {
            const photoStr = await resolveImageBase64(
                photo,
                feed?.photo,
                isEdit ? undefined : t('photo') + ' ' + t('required'),
            );
            if (isEdit) {
                await feedService.updateFeed({
                    params: { path: { id: feed.id } },
                    body: { text, photo: photoStr },
                });
            } else {
                await feedService.createFeed({
                    body: { text, photo: photoStr },
                });
            }
        },
        onSuccess: () => {
            onClose();
            queryClient.invalidateQueries({ queryKey: ['feeds'] });
            queryClient.invalidateQueries({ queryKey: ['user-feeds'] });
            queryClient.invalidateQueries({ queryKey: ['user-profile-feeds'] });
            notifications.show({
                title: t('feeds'),
                message: isEdit ? t('feedUpdated') : t('feedAdded'),
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
    const hasExistingPhoto = isEdit && !!feed?.photo;
    const isPhotoRequired = !hasExistingPhoto;
    const canSubmit = isPhotoRequired ? !!text.trim() && !!photo : !!text.trim();

    return (
        <Modal opened={opened} onClose={onClose} title={isEdit ? t('editFeed') : t('addFeed')} size="lg" zIndex={1000}>
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
                    description={hasExistingPhoto ? t('leaveEmptyToKeep') : undefined}
                    accept="image/*"
                    leftSection={<IconPhoto size={16} />}
                    value={photo}
                    error={fieldErrors.photo}
                    onChange={setPhoto}
                    clearable
                    required={isPhotoRequired}
                />
                <Button loading={isSubmitting} disabled={isSubmitting || !canSubmit} onClick={() => mutation.mutate()}>
                    {isEdit ? t('save') : t('add')}
                </Button>
            </Stack>
        </Modal>
    );
}
