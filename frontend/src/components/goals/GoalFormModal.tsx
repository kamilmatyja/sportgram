import { useState, useEffect } from 'react';
import { Modal, Stack, TextInput, Select, SimpleGrid, MultiSelect, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { goalService, type GoalResource } from '../../api/services';
import { useAuth } from '../../auth';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { useFormErrors } from '../../hooks';
import { useOffline } from '../../services';
import { toInputDateTime } from '../../utils';
import { slugify } from '../../utils';

export interface GoalFormModalProps {
    opened: boolean;
    onClose: () => void;
    goal?: GoalResource | null;
    collaboratorOptions?: { value: string; label: string }[];
    onSuccess?: () => void;
}

const INITIAL_FORM_DATA = {
    text: '',
    link: '',
    discipline: null as string | null,
    distance: '',
    time: '',
    startedAt: '',
    endedAt: '',
};

export function GoalFormModal({ opened, onClose, goal, collaboratorOptions = [], onSuccess }: GoalFormModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();
    const { isOffline } = useOffline();
    const { fieldErrors, handleFormError, clearFieldErrors } = useFormErrors();
    const isEdit = !!goal;

    const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);

    useEffect(() => {
        if (!opened) return;
        if (goal) {
            setFormData({
                text: goal.text ?? '',
                link: goal.link ?? '',
                discipline: goal.discipline != null ? String(goal.discipline) : null,
                distance: goal.distance != null ? String(goal.distance) : '',
                time: goal.time != null ? String(goal.time) : '',
                startedAt: toInputDateTime(goal.startedAt),
                endedAt: toInputDateTime(goal.endedAt),
            });
            const collabs = goal.participants?.filter((p) => p.userId !== goal.userId).map((p) => p.userId) ?? [];
            setCollaboratorIds(collabs);
        } else {
            setFormData(INITIAL_FORM_DATA);
            setCollaboratorIds([]);
        }
        clearFieldErrors();
    }, [opened, goal, clearFieldErrors]);

    const mutation = useMutation({
        mutationFn: async () => {
            const ownerId = isEdit ? goal.userId : currentUser?.id;
            const userIds = Array.from(new Set([ownerId, ...collaboratorIds].filter(Boolean))) as string[];

            const body = {
                text: formData.text,
                link: formData.link,
                discipline: Number(formData.discipline) as DisciplineEnum,
                distance: Math.round(Number(formData.distance)) || 0,
                time: formData.time ? Math.round(Number(formData.time)) : null,
                startedAt: formData.startedAt || null,
                endedAt: formData.endedAt || null,
                userIds,
            };

            if (isEdit) {
                await goalService.updateGoal({ params: { path: { id: goal.id } }, body });
            } else {
                await goalService.createGoal({ body });
            }
        },
        onSuccess: () => {
            onClose();
            void queryClient.invalidateQueries({ queryKey: ['goals'] });
            void queryClient.invalidateQueries({ queryKey: ['user-goals'] });
            if (isEdit) {
                void queryClient.invalidateQueries({ queryKey: ['goal', goal.link] });
                void queryClient.invalidateQueries({ queryKey: ['goal', formData.link] });
            }
            notifications.show({
                title: t('goals'),
                message: isEdit ? t('saved') : t('created'),
                color: 'green',
            });
            onSuccess?.();
        },
        onError: handleFormError,
    });

    const isSubmitting = mutation.isPending;
    const canSubmit =
        !!formData.text.trim() &&
        !!formData.link.trim() &&
        formData.discipline !== null &&
        formData.distance.trim().length > 0;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={isEdit ? t('editGoal') : t('addGoal')}
            data-goal-modal="true"
            data-offline-allowed="true"
            className="training-goal-modal"
        >
            <Stack gap="sm" data-goal-modal="true" data-offline-allowed="true">
                <TextInput
                    label={t('title')}
                    required
                    value={formData.text}
                    error={fieldErrors.text}
                    onChange={(e) => {
                        const val = e.currentTarget.value;
                        const prevGenerated = slugify(formData.text).slice(0, 30);
                        const nextGenerated = slugify(val).slice(0, 30);
                        if (!isEdit && (!formData.link || formData.link === prevGenerated)) {
                            setFormData({ ...formData, text: val, link: nextGenerated });
                        } else {
                            setFormData({ ...formData, text: val });
                        }
                    }}
                />

                <TextInput
                    label={t('link')}
                    required
                    value={formData.link}
                    error={fieldErrors.link}
                    onChange={(e) => setFormData({ ...formData, link: e.currentTarget.value })}
                />

                <Select
                    label={t('discipline')}
                    placeholder={t('discipline')}
                    required
                    clearable
                    data={DisciplineEnum.getOptions(t).map((opt) => ({
                        value: String(opt.value),
                        label: opt.label,
                    }))}
                    value={formData.discipline}
                    error={fieldErrors.discipline}
                    onChange={(val) => setFormData({ ...formData, discipline: val })}
                />

                <SimpleGrid>
                    <TextInput
                        label={t('distanceMeters')}
                        required
                        value={formData.distance}
                        error={fieldErrors.distance}
                        onChange={(e) => setFormData({ ...formData, distance: e.currentTarget.value })}
                    />
                    <TextInput
                        label={t('timeSeconds')}
                        value={formData.time}
                        error={fieldErrors.time}
                        onChange={(e) => setFormData({ ...formData, time: e.currentTarget.value })}
                    />
                </SimpleGrid>

                <SimpleGrid>
                    <TextInput
                        label={t('startedAt')}
                        type="datetime-local"
                        value={formData.startedAt}
                        error={fieldErrors.startedAt}
                        onChange={(e) => setFormData({ ...formData, startedAt: e.currentTarget.value })}
                    />
                    <TextInput
                        label={t('endedAt')}
                        type="datetime-local"
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
