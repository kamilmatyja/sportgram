import { useState, useEffect } from 'react';
import { Modal, Stack, TextInput, Textarea, MultiSelect, SimpleGrid, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import { trainingService, type TrainingResource } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { slugify } from '../../utils/text';
import { TrainingDisciplinesEditor, type FormTrainingDiscipline } from './TrainingDisciplinesEditor';

export interface TrainingFormModalProps {
    opened: boolean;
    onClose: () => void;
    training?: TrainingResource | null;
    collaboratorOptions?: { value: string; label: string }[];
    onSuccess?: () => void;
}

export function TrainingFormModal({
    opened,
    onClose,
    training,
    collaboratorOptions = [],
    onSuccess,
}: TrainingFormModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();
    const isEdit = !!training;

    const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        link: '',
        location: '',
        startedAt: '',
        endedAt: '',
    });
    const [disciplines, setDisciplines] = useState<FormTrainingDiscipline[]>([]);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!opened) return;
        if (training) {
            setFormData({
                title: training.title ?? '',
                description: training.description ?? '',
                link: training.link ?? '',
                location: training.location ?? '',
                startedAt: training.startedAt ? training.startedAt.replace(' ', 'T').slice(0, 16) : '',
                endedAt: training.endedAt ? training.endedAt.replace(' ', 'T').slice(0, 16) : '',
            });

            const collabs =
                training.participants?.filter((p) => p.userId !== training.userId).map((p) => p.userId) ?? [];
            setCollaboratorIds(collabs);

            if (training.disciplines) {
                setDisciplines(
                    training.disciplines.map((d) => ({
                        id: d.id,
                        discipline: String(d.discipline),
                        distances:
                            d.distances?.map((dist) => ({
                                id: dist.id,
                                distance: String(dist.distance),
                                time: String(dist.time),
                                subDistances:
                                    dist.subDistances?.map((sd) => ({
                                        id: sd.id,
                                        subDistance: String(sd.subDistance),
                                        time: String(sd.time),
                                        lat: sd.lat != null ? String(sd.lat) : '',
                                        lng: sd.lng != null ? String(sd.lng) : '',
                                        accuracy: sd.accuracy != null ? String(sd.accuracy) : '',
                                        speed: sd.speed != null ? String(sd.speed) : '',
                                    })) || [],
                            })) || [],
                    })),
                );
            } else {
                setDisciplines([]);
            }
        } else {
            setFormData({
                title: '',
                description: '',
                link: '',
                location: '',
                startedAt: '',
                endedAt: '',
            });
            setCollaboratorIds([]);
            setDisciplines([]);
        }
        setFieldErrors({});
    }, [opened, training]);

    const mutation = useMutation({
        mutationFn: async () => {
            const mappedDisciplines = disciplines
                .filter((d) => d.discipline !== null)
                .map((d) => ({
                    discipline: Number(d.discipline) as DisciplineEnum,
                    distances: d.distances.map((dist) => ({
                        distance: Number(dist.distance) || 0,
                        time: Number(dist.time) || 0,
                        subDistances: (dist.subDistances || []).map((sd) => ({
                            subDistance: Number(sd.subDistance) || 0,
                            time: Number(sd.time) || 0,
                            lat: sd.lat ? Number(sd.lat) : null,
                            lng: sd.lng ? Number(sd.lng) : null,
                            accuracy: sd.accuracy ? Number(sd.accuracy) : null,
                            speed: sd.speed ? Number(sd.speed) : null,
                        })),
                    })),
                }));

            if (isEdit) {
                const resolvedUserIds = training.userId
                    ? Array.from(new Set([training.userId, ...collaboratorIds]))
                    : collaboratorIds;

                await trainingService.updateTraining({
                    params: { path: { id: training.id } },
                    body: {
                        title: formData.title,
                        description: formData.description,
                        link: formData.link,
                        location: formData.location,
                        startedAt: formData.startedAt,
                        endedAt: formData.endedAt,
                        userIds: resolvedUserIds,
                        disciplines: mappedDisciplines,
                    },
                });
            } else {
                const resolvedUserIds = currentUser?.id
                    ? Array.from(new Set([currentUser.id, ...collaboratorIds]))
                    : collaboratorIds;

                await trainingService.createTraining({
                    body: {
                        title: formData.title,
                        description: formData.description,
                        link: formData.link,
                        location: formData.location,
                        startedAt: formData.startedAt,
                        endedAt: formData.endedAt,
                        userIds: resolvedUserIds,
                        disciplines: mappedDisciplines,
                    },
                });
            }
        },
        onSuccess: () => {
            onClose();
            queryClient.invalidateQueries({ queryKey: ['trainings'] });
            queryClient.invalidateQueries({ queryKey: ['user-trainings'] });
            if (isEdit) {
                queryClient.invalidateQueries({ queryKey: ['training', training.link] });
                queryClient.invalidateQueries({ queryKey: ['training', formData.link] });
            }
            notifications.show({
                title: t('trainings'),
                message: isEdit ? t('trainingUpdated') : t('trainingCreated'),
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
    const canSubmit =
        !!formData.title.trim() &&
        !!formData.description.trim() &&
        !!formData.link.trim() &&
        !!formData.location.trim() &&
        !!formData.startedAt &&
        !!formData.endedAt;

    return (
        <Modal opened={opened} onClose={onClose} title={isEdit ? t('edit') : t('add')}>
            <Stack gap="sm">
                <TextInput
                    label={t('title')}
                    required
                    value={formData.title}
                    error={fieldErrors.title}
                    onChange={(e) => {
                        const val = e.currentTarget.value;
                        const prevGenerated = slugify(formData.title);
                        const nextGenerated = slugify(val);
                        if (!isEdit && (!formData.link || formData.link === prevGenerated)) {
                            setFormData({ ...formData, title: val, link: nextGenerated });
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

                <TrainingDisciplinesEditor disciplines={disciplines} onChange={setDisciplines} />

                <Button
                    loading={isSubmitting}
                    disabled={isSubmitting || !canSubmit}
                    onClick={() => mutation.mutate()}
                    mt="md"
                >
                    {isEdit ? t('save') : t('add')}
                </Button>
            </Stack>
        </Modal>
    );
}
