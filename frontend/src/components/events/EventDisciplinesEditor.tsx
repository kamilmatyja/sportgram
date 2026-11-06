import { Stack, Group, Paper, Select, TextInput, Button, ActionIcon, Tooltip, Text } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { DisciplineEnum } from '../../enums/DisciplineEnum';

export interface FormEventSubDistance {
    id: string;
    subDistance: string;
}

export interface FormEventDistance {
    id: string;
    distance: string;
    subDistances: FormEventSubDistance[];
}

export interface FormEventDiscipline {
    id: string;
    discipline: string | null;
    distances: FormEventDistance[];
}

export interface EventDisciplinesEditorProps {
    disciplines: FormEventDiscipline[];
    onChange: (disciplines: FormEventDiscipline[]) => void;
}

export function EventDisciplinesEditor({ disciplines, onChange }: EventDisciplinesEditorProps) {
    const { t } = useTranslation();

    const handleAddDiscipline = () => {
        onChange([
            ...disciplines,
            {
                id: crypto.randomUUID(),
                discipline: null,
                distances: [],
            },
        ]);
    };

    const handleRemoveDiscipline = (id: string) => {
        onChange(disciplines.filter((d) => d.id !== id));
    };

    const handleDisciplineChange = (id: string, val: string | null) => {
        onChange(disciplines.map((d) => (d.id === id ? { ...d, discipline: val } : d)));
    };

    const handleAddDistance = (disciplineId: string) => {
        onChange(
            disciplines.map((d) => {
                if (d.id !== disciplineId) return d;
                return {
                    ...d,
                    distances: [
                        ...d.distances,
                        {
                            id: crypto.randomUUID(),
                            distance: '',
                            subDistances: [],
                        },
                    ],
                };
            }),
        );
    };

    const handleRemoveDistance = (disciplineId: string, distanceId: string) => {
        onChange(
            disciplines.map((d) => {
                if (d.id !== disciplineId) return d;
                return {
                    ...d,
                    distances: d.distances.filter((dist) => dist.id !== distanceId),
                };
            }),
        );
    };

    const handleDistanceChange = (disciplineId: string, distanceId: string, val: string) => {
        onChange(
            disciplines.map((d) => {
                if (d.id !== disciplineId) return d;
                return {
                    ...d,
                    distances: d.distances.map((dist) => (dist.id === distanceId ? { ...dist, distance: val } : dist)),
                };
            }),
        );
    };

    const handleAddSubDistance = (disciplineId: string, distanceId: string) => {
        onChange(
            disciplines.map((d) => {
                if (d.id !== disciplineId) return d;
                return {
                    ...d,
                    distances: d.distances.map((dist) => {
                        if (dist.id !== distanceId) return dist;
                        return {
                            ...dist,
                            subDistances: [
                                ...(dist.subDistances || []),
                                {
                                    id: crypto.randomUUID(),
                                    subDistance: '',
                                },
                            ],
                        };
                    }),
                };
            }),
        );
    };

    const handleRemoveSubDistance = (disciplineId: string, distanceId: string, subDistanceId: string) => {
        onChange(
            disciplines.map((d) => {
                if (d.id !== disciplineId) return d;
                return {
                    ...d,
                    distances: d.distances.map((dist) => {
                        if (dist.id !== distanceId) return dist;
                        return {
                            ...dist,
                            subDistances: dist.subDistances?.filter((sd) => sd.id !== subDistanceId) || [],
                        };
                    }),
                };
            }),
        );
    };

    const handleSubDistanceChange = (disciplineId: string, distanceId: string, subDistanceId: string, val: string) => {
        onChange(
            disciplines.map((d) => {
                if (d.id !== disciplineId) return d;
                return {
                    ...d,
                    distances: d.distances.map((dist) => {
                        if (dist.id !== distanceId) return dist;
                        return {
                            ...dist,
                            subDistances: dist.subDistances?.map((sd) =>
                                sd.id === subDistanceId ? { ...sd, subDistance: val } : sd,
                            ),
                        };
                    }),
                };
            }),
        );
    };

    return (
        <Stack gap="sm">
            <Group justify="space-between" align="center" mt="xs">
                <Text fw={500} size="sm">
                    {t('disciplinesAndDistances')}
                </Text>
                <Button size="xs" variant="light" leftSection={<IconPlus size={16} />} onClick={handleAddDiscipline}>
                    {t('addDiscipline')}
                </Button>
            </Group>

            {disciplines.map((d) => (
                <Paper key={d.id} withBorder p="sm" radius="md">
                    <Group justify="space-between" align="flex-end" mb="xs">
                        <Select
                            label={t('discipline')}
                            placeholder={t('discipline')}
                            required
                            clearable
                            data={DisciplineEnum.getStringOptions(t)}
                            value={d.discipline}
                            onChange={(val) => handleDisciplineChange(d.id, val)}
                            flex={1}
                        />
                        <Tooltip label={t('delete')} withArrow>
                            <ActionIcon
                                color="red"
                                variant="light"
                                size={30}
                                onClick={() => handleRemoveDiscipline(d.id)}
                                aria-label={t('delete')}
                            >
                                <IconTrash size={16} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>

                    <Stack gap="sm" mt="xs">
                        {d.distances.map((dist) => (
                            <Paper key={dist.id} p="xs" radius="sm" withBorder bg="var(--mantine-color-gray-light)">
                                <Group gap="xs" align="flex-end">
                                    <TextInput
                                        label={t('distanceMeters')}
                                        required
                                        flex={1}
                                        value={dist.distance}
                                        onChange={(e) => handleDistanceChange(d.id, dist.id, e.currentTarget.value)}
                                    />
                                    <Tooltip label={t('delete')} withArrow>
                                        <ActionIcon
                                            color="red"
                                            variant="light"
                                            size={30}
                                            onClick={() => handleRemoveDistance(d.id, dist.id)}
                                            aria-label={t('delete')}
                                        >
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>

                                <Stack gap="xs" mt="xs" pl="sm" className="subdistances-container">
                                    <Group justify="space-between" align="center">
                                        <Text size="xs" fw={600} c="dimmed">
                                            {t('subDistances')}
                                        </Text>
                                        <Button
                                            size="compact-xs"
                                            variant="subtle"
                                            leftSection={<IconPlus size={16} />}
                                            onClick={() => handleAddSubDistance(d.id, dist.id)}
                                        >
                                            {t('addSubDistance')}
                                        </Button>
                                    </Group>

                                    {dist.subDistances?.map((sd) => (
                                        <Group key={sd.id} gap="xs" align="flex-end">
                                            <TextInput
                                                size="xs"
                                                label={t('subDistanceMeters')}
                                                required
                                                flex={1}
                                                value={sd.subDistance}
                                                onChange={(e) =>
                                                    handleSubDistanceChange(d.id, dist.id, sd.id, e.currentTarget.value)
                                                }
                                            />
                                            <Tooltip label={t('delete')} withArrow>
                                                <ActionIcon
                                                    color="red"
                                                    variant="light"
                                                    size={26}
                                                    onClick={() => handleRemoveSubDistance(d.id, dist.id, sd.id)}
                                                    aria-label={t('delete')}
                                                >
                                                    <IconTrash size={14} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    ))}
                                </Stack>
                            </Paper>
                        ))}

                        <Button
                            size="xs"
                            variant="subtle"
                            leftSection={<IconPlus size={16} />}
                            onClick={() => handleAddDistance(d.id)}
                        >
                            {t('addDistance')}
                        </Button>
                    </Stack>
                </Paper>
            ))}
        </Stack>
    );
}
