import { Stack, Group, Paper, Select, TextInput, Button, ActionIcon, Tooltip, Text, SimpleGrid } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { DisciplineEnum } from '../../enums/DisciplineEnum';

export interface FormTrainingSubDistance {
    id: string;
    subDistance: string;
    time: string;
    lat: string;
    lng: string;
    accuracy: string;
    speed: string;
}

export interface FormTrainingDistance {
    id: string;
    distance: string;
    time: string;
    subDistances: FormTrainingSubDistance[];
}

export interface FormTrainingDiscipline {
    id: string;
    discipline: string | null;
    distances: FormTrainingDistance[];
}

export interface TrainingDisciplinesEditorProps {
    disciplines: FormTrainingDiscipline[];
    onChange: (disciplines: FormTrainingDiscipline[]) => void;
}

export function TrainingDisciplinesEditor({ disciplines, onChange }: TrainingDisciplinesEditorProps) {
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
                            time: '',
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

    const handleDistanceChange = (
        disciplineId: string,
        distanceId: string,
        field: 'distance' | 'time',
        val: string,
    ) => {
        onChange(
            disciplines.map((d) => {
                if (d.id !== disciplineId) return d;
                return {
                    ...d,
                    distances: d.distances.map((dist) => (dist.id === distanceId ? { ...dist, [field]: val } : dist)),
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
                                    time: '',
                                    lat: '',
                                    lng: '',
                                    accuracy: '',
                                    speed: '',
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

    const handleSubDistanceChange = (
        disciplineId: string,
        distanceId: string,
        subDistanceId: string,
        field: keyof FormTrainingSubDistance,
        val: string,
    ) => {
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
                                sd.id === subDistanceId ? { ...sd, [field]: val } : sd,
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
                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                                    <TextInput
                                        label={t('distanceMeters')}
                                        required
                                        value={dist.distance}
                                        onChange={(e) =>
                                            handleDistanceChange(d.id, dist.id, 'distance', e.currentTarget.value)
                                        }
                                    />
                                    <TextInput
                                        label={t('timeSeconds')}
                                        required
                                        value={dist.time}
                                        onChange={(e) =>
                                            handleDistanceChange(d.id, dist.id, 'time', e.currentTarget.value)
                                        }
                                    />
                                </SimpleGrid>
                                <Group justify="flex-end" mt={4}>
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
                                        <Paper key={sd.id} p="xs" withBorder radius="xs">
                                            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xs">
                                                <TextInput
                                                    size="xs"
                                                    label={t('subDistanceMeters')}
                                                    required
                                                    value={sd.subDistance}
                                                    onChange={(e) =>
                                                        handleSubDistanceChange(
                                                            d.id,
                                                            dist.id,
                                                            sd.id,
                                                            'subDistance',
                                                            e.currentTarget.value,
                                                        )
                                                    }
                                                />
                                                <TextInput
                                                    size="xs"
                                                    label={t('timeSeconds')}
                                                    required
                                                    value={sd.time}
                                                    onChange={(e) =>
                                                        handleSubDistanceChange(
                                                            d.id,
                                                            dist.id,
                                                            sd.id,
                                                            'time',
                                                            e.currentTarget.value,
                                                        )
                                                    }
                                                />
                                                <TextInput
                                                    size="xs"
                                                    label={t('lat')}
                                                    value={sd.lat}
                                                    onChange={(e) =>
                                                        handleSubDistanceChange(
                                                            d.id,
                                                            dist.id,
                                                            sd.id,
                                                            'lat',
                                                            e.currentTarget.value,
                                                        )
                                                    }
                                                />
                                                <TextInput
                                                    size="xs"
                                                    label={t('lng')}
                                                    value={sd.lng}
                                                    onChange={(e) =>
                                                        handleSubDistanceChange(
                                                            d.id,
                                                            dist.id,
                                                            sd.id,
                                                            'lng',
                                                            e.currentTarget.value,
                                                        )
                                                    }
                                                />
                                                <TextInput
                                                    size="xs"
                                                    label={t('accuracy')}
                                                    value={sd.accuracy}
                                                    onChange={(e) =>
                                                        handleSubDistanceChange(
                                                            d.id,
                                                            dist.id,
                                                            sd.id,
                                                            'accuracy',
                                                            e.currentTarget.value,
                                                        )
                                                    }
                                                />
                                                <TextInput
                                                    size="xs"
                                                    label={t('speed')}
                                                    value={sd.speed}
                                                    onChange={(e) =>
                                                        handleSubDistanceChange(
                                                            d.id,
                                                            dist.id,
                                                            sd.id,
                                                            'speed',
                                                            e.currentTarget.value,
                                                        )
                                                    }
                                                />
                                            </SimpleGrid>
                                            <Group justify="flex-end" mt={4}>
                                                <Tooltip label={t('delete')} withArrow>
                                                    <ActionIcon
                                                        color="red"
                                                        variant="light"
                                                        size={30}
                                                        onClick={() => handleRemoveSubDistance(d.id, dist.id, sd.id)}
                                                        aria-label={t('delete')}
                                                    >
                                                        <IconTrash size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>
                                        </Paper>
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
