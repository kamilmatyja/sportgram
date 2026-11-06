import { useState, useEffect } from 'react';
import { Modal, Stack, TextInput, Textarea, FileInput, Select, SimpleGrid, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPhoto } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import { eventService, type EventResource } from '../../api/services';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { resolveImageBase64 } from '../../utils/imageUtils';
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
    const isEdit = !!event;

    const [selectedPageParticipantId, setSelectedPageParticipantId] = useState<string | null>(
        defaultPageParticipantId ?? null,
    );
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        link: '',
        location: '',
        rules: '',
        startedAt: '',
        endedAt: '',
    });
    const [disciplines, setDisciplines] = useState<FormEventDiscipline[]>([]);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
                startedAt: event.startedAt ? event.startedAt.replace(' ', 'T').slice(0, 16) : '',
                endedAt: event.endedAt ? event.endedAt.replace(' ', 'T').slice(0, 16) : '',
            });

            if (event.disciplines) {
                setDisciplines(
                    event.disciplines.map((d) => ({
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
                    })),
                );
            } else {
                setDisciplines([]);
            }
        } else {
            setSelectedPageParticipantId(defaultPageParticipantId ?? null);
            setFormData({
                title: '',
                description: '',
                link: '',
                location: '',
                rules: '',
                startedAt: '',
                endedAt: '',
            });
            setDisciplines([]);
        }
        setPhotoFile(null);
        setFieldErrors({});
    }, [opened, event, defaultPageParticipantId]);

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
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['user-events'] });
            if (isEdit) {
                queryClient.invalidateQueries({ queryKey: ['event', event.link] });
                queryClient.invalidateQueries({ queryKey: ['event', formData.link] });
            }
            notifications.show({
                title: t('events'),
                message: isEdit ? t('eventUpdated') : t('eventCreated'),
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
        ? !!formData.title.trim() &&
          !!formData.description.trim() &&
          !!formData.link.trim() &&
          !!formData.location.trim() &&
          !!formData.startedAt &&
          !!formData.endedAt
        : !!selectedPageParticipantId &&
          !!formData.title.trim() &&
          !!formData.description.trim() &&
          !!formData.link.trim() &&
          !!formData.location.trim() &&
          !!formData.startedAt &&
          !!formData.endedAt &&
          !!photoFile;

    return (
        <Modal opened={opened} onClose={onClose} title={isEdit ? t('editEvent') : t('addEvent')} size="lg">
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

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
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

                <FileInput
                    label={t('photo')}
                    placeholder={t('selectPhoto')}
                    description={isEdit ? t('leaveEmptyToKeep') : undefined}
                    required={!isEdit}
                    accept="image/*"
                    leftSection={<IconPhoto size={16} />}
                    value={photoFile}
                    error={fieldErrors.photo}
                    onChange={setPhotoFile}
                    clearable
                />

                <EventDisciplinesEditor disciplines={disciplines} onChange={setDisciplines} />

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
