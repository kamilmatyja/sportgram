import { useState, useEffect } from 'react';
import { Modal, Stack, TextInput, Textarea, Select, SimpleGrid, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ImageInput } from '../common';
import { eventService, type EventResource } from '../../api/services';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { useFormErrors } from '../../hooks';
import { useOffline } from '../../services';
import { toInputDateTime } from '../../utils';
import { resolveImageBase64 } from '../../utils';
import { updateTitleWithSlug } from '../../utils';
import { EventDisciplinesEditor, type FormEventDiscipline } from './EventDisciplinesEditor';

export interface PageParticipantOption {
    value: string;
    label: string;
}

export interface EventFormModalProps {
    opened: boolean;
    onClose: () => void;
    event?: EventResource | null;
    defaultPageParticipantId?: string | null;
    pageOptions?: PageParticipantOption[];
    onSuccess?: () => void;
}

const INITIAL_FORM_DATA = {
    title: '',
    description: '',
    link: '',
    location: '',
    rules: '',
    startedAt: '',
    endedAt: '',
};

export function EventFormModal({
    opened,
    onClose,
    event,
    defaultPageParticipantId,
    pageOptions = [],
    onSuccess,
}: EventFormModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { fieldErrors, handleFormError, clearFieldErrors } = useFormErrors();
    const { isOffline } = useOffline();
    const isEdit = !!event;

    const [selectedPageParticipantId, setSelectedPageParticipantId] = useState<string | null>(
        defaultPageParticipantId ?? null,
    );
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [disciplines, setDisciplines] = useState<FormEventDiscipline[]>([]);

    useEffect(() => {
        if (!opened) return;
        if (event) {
            setSelectedPageParticipantId(event.pageParticipantId ?? defaultPageParticipantId ?? null);
            setFormData({
                title: event.title ?? '',
                description: event.description ?? '',
                link: event.link ?? '',
                location: event.location ?? '',
                rules: event.rules ?? '',
                startedAt: toInputDateTime(event.startedAt),
                endedAt: toInputDateTime(event.endedAt),
            });

            setDisciplines(
                event.disciplines?.map((d) => ({
                    id: d.id,
                    discipline: String(d.discipline),
                    distances:
                        d.distances?.map((dist) => ({
                            id: dist.id,
                            distance: String(dist.distance),
                            subDistances:
                                dist.subDistances?.map((sd) => ({
                                    id: sd.id,
                                    subDistance: String(sd.subDistance),
                                })) || [],
                        })) || [],
                })) ?? [],
            );
        } else {
            setSelectedPageParticipantId(defaultPageParticipantId ?? null);
            setFormData(INITIAL_FORM_DATA);
            setDisciplines([]);
        }
        setPhotoFile(null);
        clearFieldErrors();
    }, [opened, event, defaultPageParticipantId, clearFieldErrors]);

    const mutation = useMutation({
        mutationFn: async () => {
            const mappedDisciplines = disciplines
                .filter((d) => d.discipline !== null)
                .map((d) => ({
                    discipline: Number(d.discipline) as DisciplineEnum,
                    distances: d.distances.map((dist) => ({
                        distance: Number(dist.distance) || 0,
                        subDistances: (dist.subDistances || []).map((sd) => ({
                            subDistance: Number(sd.subDistance) || 0,
                        })),
                    })),
                }));

            if (!isEdit && !selectedPageParticipantId) {
                throw new Error(t('selectPage'));
            }
            const photoStr = await resolveImageBase64(photoFile, event?.photo, isEdit ? undefined : t('selectPhoto'));
            const payload = {
                title: formData.title,
                description: formData.description,
                link: formData.link,
                location: formData.location,
                rules: formData.rules || '',
                startedAt: formData.startedAt,
                endedAt: formData.endedAt,
                photo: photoStr,
                disciplines: mappedDisciplines,
            };

            if (isEdit) {
                await eventService.updateEvent({
                    params: { path: { id: event.id } },
                    body: payload,
                });
            } else {
                await eventService.createEvent({
                    params: { path: { id: selectedPageParticipantId! } },
                    body: payload,
                });
            }
        },
        onSuccess: () => {
            onClose();
            void queryClient.invalidateQueries({ queryKey: ['events'] });
            void queryClient.invalidateQueries({ queryKey: ['user-events'] });
            if (isEdit) {
                void queryClient.invalidateQueries({ queryKey: ['event', event.link] });
                void queryClient.invalidateQueries({ queryKey: ['event', formData.link] });
            }
            notifications.show({
                title: t('events'),
                message: isEdit ? t('saved') : t('created'),
                color: 'green',
            });
            onSuccess?.();
        },
        onError: handleFormError,
    });

    const isSubmitting = mutation.isPending;
    const areDisciplinesValid = disciplines.every(
        (d) =>
            !!d.discipline &&
            d.distances.every(
                (dist) => !!dist.distance.trim() && dist.subDistances.every((sd) => !!sd.subDistance.trim()),
            ),
    );
    const canSubmit = isEdit
        ? !!formData.title.trim() &&
          !!formData.description.trim() &&
          !!formData.link.trim() &&
          !!formData.location.trim() &&
          !!formData.rules.trim() &&
          !!formData.startedAt &&
          !!formData.endedAt &&
          areDisciplinesValid
        : !!selectedPageParticipantId &&
          !!formData.title.trim() &&
          !!formData.description.trim() &&
          !!formData.link.trim() &&
          !!formData.location.trim() &&
          !!formData.rules.trim() &&
          !!formData.startedAt &&
          !!formData.endedAt &&
          !!photoFile &&
          areDisciplinesValid;

    return (
        <Modal opened={opened} onClose={onClose} title={isEdit ? t('editEvent') : t('addEvent')}>
            <Stack gap="sm">
                {!isEdit && !defaultPageParticipantId && pageOptions.length > 0 && (
                    <Select
                        label={t('page')}
                        placeholder={t('selectPage')}
                        required
                        data={pageOptions}
                        value={selectedPageParticipantId}
                        error={fieldErrors.pageParticipantId}
                        onChange={setSelectedPageParticipantId}
                    />
                )}

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

                <TextInput
                    label={t('location')}
                    required
                    value={formData.location}
                    error={fieldErrors.location}
                    onChange={(e) => setFormData({ ...formData, location: e.currentTarget.value })}
                />

                <Textarea
                    label={t('rules')}
                    rows={3}
                    minRows={3}
                    value={formData.rules}
                    error={fieldErrors.rules}
                    onChange={(e) => setFormData({ ...formData, rules: e.currentTarget.value })}
                    required
                />

                <SimpleGrid>
                    <TextInput
                        label={t('startedAt')}
                        type="datetime-local"
                        required
                        value={formData.startedAt}
                        error={fieldErrors.startedAt}
                        onChange={(e) => setFormData({ ...formData, startedAt: e.currentTarget.value })}
                    />
                    <TextInput
                        label={t('endedAt')}
                        type="datetime-local"
                        required
                        value={formData.endedAt}
                        error={fieldErrors.endedAt}
                        onChange={(e) => setFormData({ ...formData, endedAt: e.currentTarget.value })}
                    />
                </SimpleGrid>

                <ImageInput
                    label={t('photo')}
                    description={isEdit ? t('leaveEmptyToKeep') : undefined}
                    required={!isEdit}
                    value={photoFile}
                    error={fieldErrors.photo}
                    onChange={setPhotoFile}
                    disabled={isOffline}
                />

                <EventDisciplinesEditor disciplines={disciplines} onChange={setDisciplines} disabled={isOffline} />

                <Button
                    loading={isSubmitting}
                    disabled={isSubmitting || !canSubmit || isOffline}
                    onClick={() => mutation.mutate()}
                    mt="sm"
                >
                    {t('save')}
                </Button>
            </Stack>
        </Modal>
    );
}
