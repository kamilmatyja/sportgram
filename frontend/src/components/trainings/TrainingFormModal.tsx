import { useState, useEffect } from 'react';
import { Modal, Stack, TextInput, Textarea, MultiSelect, SimpleGrid, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { trainingService, type TrainingResource } from '../../api/services';
import { useAuth } from '../../auth';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { useFormErrors } from '../../hooks';
import { useOffline } from '../../services';
import { toInputDateTime, updateTitleWithSlug, coordFromBackendInt, coordToBackendInt } from '../../utils';
import { TrainingDisciplinesEditor, type FormTrainingDiscipline } from './TrainingDisciplinesEditor';

export interface TrainingFormModalProps {
    opened: boolean;
    onClose: () => void;
    training?: TrainingResource | null;
    collaboratorOptions?: { value: string; label: string }[];
    onSuccess?: () => void;
}

const INITIAL_FORM_DATA = {
    title: '',
    description: '',
    link: '',
    location: '',
    startedAt: '',
    endedAt: '',
};

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
    const { isOffline } = useOffline();
    const { fieldErrors, handleFormError, clearFieldErrors } = useFormErrors();
    const isEdit = !!training;

    const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [disciplines, setDisciplines] = useState<FormTrainingDiscipline[]>([]);

    const handleSessionTimes = ({ startedAt, endedAt }: { startedAt: Date; endedAt: Date }) => {
        setFormData((prev) => {
            const next = { ...prev };
            if (!next.startedAt) {
                next.startedAt = toInputDateTime(startedAt.toISOString());
            }
            if (!next.endedAt) {
                next.endedAt = toInputDateTime(endedAt.toISOString());
            }
            return next;
        });
    };

    useEffect(() => {
        if (!opened) return;
        if (training) {
            setFormData({
                title: training.title ?? '',
                description: training.description ?? '',
                link: training.link ?? '',
                location: training.location ?? '',
                startedAt: toInputDateTime(training.startedAt),
                endedAt: toInputDateTime(training.endedAt),
            });

            const collabs =
                training.participants?.filter((p) => p.userId !== training.userId).map((p) => p.userId) ?? [];
            setCollaboratorIds(collabs);

            setDisciplines(
                training.disciplines?.map((d) => ({
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
                                    lat: sd.lat != null ? String(coordFromBackendInt(sd.lat)) : '',
                                    lng: sd.lng != null ? String(coordFromBackendInt(sd.lng)) : '',
                                    accuracy: sd.accuracy != null ? String(sd.accuracy) : '',
                                    speed: sd.speed != null ? String(sd.speed) : '',
                                })) || [],
                        })) || [],
                })) ?? [],
            );
        } else {
            setFormData(INITIAL_FORM_DATA);
            setCollaboratorIds([]);
            setDisciplines([]);
        }
        clearFieldErrors();
    }, [opened, training, clearFieldErrors]);

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
                            lat: sd.lat ? coordToBackendInt(Number(sd.lat)) : null,
                            lng: sd.lng ? coordToBackendInt(Number(sd.lng)) : null,
                            accuracy:
                                sd.accuracy !== '' && sd.accuracy != null && !Number.isNaN(Number(sd.accuracy))
                                    ? Math.round(Number(sd.accuracy))
                                    : null,
                            speed:
                                sd.speed !== '' && sd.speed != null && !Number.isNaN(Number(sd.speed))
                                    ? Math.max(0, Math.round(Number(sd.speed)))
                                    : null,
                        })),
                    })),
                }));

            const baseUserId = isEdit ? training.userId : currentUser?.id;
            const userIds = Array.from(new Set([baseUserId, ...collaboratorIds].filter(Boolean))) as string[];

            const body = {
                title: formData.title,
                description: formData.description,
                link: formData.link,
                location: formData.location,
                startedAt: formData.startedAt,
                endedAt: formData.endedAt,
                userIds,
                disciplines: mappedDisciplines,
            };

            if (isEdit) {
                await trainingService.updateTraining({
                    params: { path: { id: training.id } },
                    body,
                });
            } else {
                await trainingService.createTraining({
                    body,
                });
            }
        },
        onSuccess: () => {
            onClose();
            void queryClient.invalidateQueries({ queryKey: ['trainings'] });
            void queryClient.invalidateQueries({ queryKey: ['user-trainings'] });
            if (isEdit) {
                void queryClient.invalidateQueries({ queryKey: ['training', training.link] });
                void queryClient.invalidateQueries({ queryKey: ['training', formData.link] });
            }
            notifications.show({
                title: t('trainings'),
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
    const canSubmit =
        !!formData.title.trim() &&
        !!formData.description.trim() &&
        !!formData.link.trim() &&
        !!formData.location.trim() &&
        !!formData.startedAt &&
        !!formData.endedAt &&
        areDisciplinesValid;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={isEdit ? t('editTraining') : t('addTraining')}
            data-training-modal="true"
            data-offline-allowed="true"
            className="training-goal-modal"
        >
            <Stack gap="sm" data-training-modal="true" data-offline-allowed="true">
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

                {(collaboratorOptions.length > 0 || isOffline) && (
                    <MultiSelect
                        label={t('collaborators')}
                        placeholder={isOffline ? t('offlineUnavailable') : t('selectCollaborators')}
                        data={collaboratorOptions}
                        value={collaboratorIds}
                        onChange={setCollaboratorIds}
                        disabled={isOffline}
                        searchable={!isOffline}
                        clearable={!isOffline}
                    />
                )}

                <TrainingDisciplinesEditor
                    disciplines={disciplines}
                    onChange={setDisciplines}
                    onSessionTimes={handleSessionTimes}
                />

                <Button
                    loading={isSubmitting}
                    disabled={isSubmitting || !canSubmit}
                    onClick={() => mutation.mutate()}
                    mt="md"
                >
                    {t('save')}
                </Button>
            </Stack>
        </Modal>
    );
}
