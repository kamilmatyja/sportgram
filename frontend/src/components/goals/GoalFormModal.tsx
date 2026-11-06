import { useState, useEffect } from 'react';
import { Modal, Stack, TextInput, Select, SimpleGrid, MultiSelect, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import { goalService, type GoalResource } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DisciplineEnum } from '../../enums/DisciplineEnum';

export interface GoalFormModalProps {
    opened: boolean;
    onClose: () => void;
    goal?: GoalResource | null;
    collaboratorOptions?: { value: string; label: string }[];
    onSuccess?: () => void;
}

export function GoalFormModal({ opened, onClose, goal, collaboratorOptions = [], onSuccess }: GoalFormModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();
    const isEdit = !!goal;

    const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        text: '',
        link: '',
        discipline: null as string | null,
        distance: '',
        time: '',
        startedAt: '',
        endedAt: '',
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!opened) return;
        if (goal) {
            setFormData({
                text: goal.text ?? '',
                link: goal.link ?? '',
                discipline: goal.discipline != null ? String(goal.discipline) : null,
                distance: goal.distance != null ? String(goal.distance) : '',
                time: goal.time != null ? String(goal.time) : '',
                startedAt: goal.startedAt ? goal.startedAt.replace(' ', 'T').slice(0, 16) : '',
                endedAt: goal.endedAt ? goal.endedAt.replace(' ', 'T').slice(0, 16) : '',
            });

            const collabs = goal.participants?.filter((p) => p.userId !== goal.userId).map((p) => p.userId) ?? [];
            setCollaboratorIds(collabs);
        } else {
            setFormData({
                text: '',
                link: '',
                discipline: null,
                distance: '',
                time: '',
                startedAt: '',
                endedAt: '',
            });
            setCollaboratorIds([]);
        }
        setFieldErrors({});
    }, [opened, goal]);

    const mutation = useMutation({
        mutationFn: async () => {
            const disciplineNum = Number(formData.discipline) as DisciplineEnum;
            const distanceNum = Math.round(Number(formData.distance)) || 0;
            const timeNum = formData.time ? Math.round(Number(formData.time)) : null;

            if (isEdit) {
                const resolvedUserIds = goal.userId
                    ? Array.from(new Set([goal.userId, ...collaboratorIds]))
                    : collaboratorIds;

                await goalService.updateGoal({
                    params: { path: { id: goal.id } },
                    body: {
                        text: formData.text,
                        link: formData.link,
                        discipline: disciplineNum,
                        distance: distanceNum,
                        time: timeNum,
                        startedAt: formData.startedAt || null,
                        endedAt: formData.endedAt || null,
                        userIds: resolvedUserIds,
                    },
                });
            } else {
                const resolvedUserIds = currentUser?.id
                    ? Array.from(new Set([currentUser.id, ...collaboratorIds]))
                    : collaboratorIds;

                await goalService.createGoal({
                    body: {
                        text: formData.text,
                        link: formData.link,
                        discipline: disciplineNum,
                        distance: distanceNum,
                        time: timeNum,
                        startedAt: formData.startedAt || null,
                        endedAt: formData.endedAt || null,
                        userIds: resolvedUserIds,
                    },
                });
            }
        },
        onSuccess: () => {
            onClose();
            queryClient.invalidateQueries({ queryKey: ['goals'] });
            queryClient.invalidateQueries({ queryKey: ['user-goals'] });
            if (isEdit) {
                queryClient.invalidateQueries({ queryKey: ['goal', goal.link] });
                queryClient.invalidateQueries({ queryKey: ['goal', formData.link] });
            }
            notifications.show({
                title: t('goals'),
                message: isEdit ? t('goalUpdated') : t('goalCreated'),
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
        !!formData.text.trim() &&
        !!formData.link.trim() &&
        formData.discipline !== null &&
        formData.distance.trim().length > 0;

    return (
        <Modal opened={opened} onClose={onClose} title={isEdit ? t('editGoal') : t('addGoal')} size="lg">
            <Stack gap="sm">
                <TextInput
                    label={t('title')}
                    required
                    value={formData.text}
                    error={fieldErrors.text}
                    onChange={(e) => {
                        const val = e.currentTarget.value;
                        if (!isEdit && !formData.link) {
                            const generatedLink = val
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)/g, '')
                                .slice(0, 30);
                            setFormData({ ...formData, text: val, link: generatedLink });
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

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
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

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
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
