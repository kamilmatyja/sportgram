import { Stack, Group, Paper, Select, TextInput, Button, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { updateItem, removeItem, patchItem, generateUuid } from '../../utils';
import { DeleteActionButton } from '../common';

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
    disabled?: boolean;
}

export function EventDisciplinesEditor({ disciplines, onChange, disabled = false }: EventDisciplinesEditorProps) {
    const { t } = useTranslation();

    const handleAddDiscipline = () => {
        onChange([...disciplines, { id: generateUuid(), discipline: null, distances: [] }]);
    };

    const handleRemoveDiscipline = (id: string) => onChange(removeItem(disciplines, id));

    const handleDisciplineChange = (id: string, val: string | null) =>
        onChange(patchItem(disciplines, id, { discipline: val }));

    const handleAddDistance = (disciplineId: string) => {
        onChange(
            updateItem(disciplines, disciplineId, (d) => ({
                ...d,
                distances: [...d.distances, { id: generateUuid(), distance: '', subDistances: [] }],
            })),
        );
    };

    const handleRemoveDistance = (disciplineId: string, distanceId: string) => {
        onChange(
            updateItem(disciplines, disciplineId, (d) => ({
                ...d,
                distances: removeItem(d.distances, distanceId),
            })),
        );
    };

    const handleDistanceChange = (disciplineId: string, distanceId: string, val: string) => {
        onChange(
            updateItem(disciplines, disciplineId, (d) => ({
                ...d,
                distances: patchItem(d.distances, distanceId, { distance: val }),
            })),
        );
    };

    const handleAddSubDistance = (disciplineId: string, distanceId: string) => {
        onChange(
            updateItem(disciplines, disciplineId, (d) => ({
                ...d,
                distances: updateItem(d.distances, distanceId, (dist) => ({
                    ...dist,
                    subDistances: [...(dist.subDistances || []), { id: generateUuid(), subDistance: '' }],
                })),
            })),
        );
    };

    const handleRemoveSubDistance = (disciplineId: string, distanceId: string, subDistanceId: string) => {
        onChange(
            updateItem(disciplines, disciplineId, (d) => ({
                ...d,
                distances: updateItem(d.distances, distanceId, (dist) => ({
                    ...dist,
                    subDistances: removeItem(dist.subDistances || [], subDistanceId),
                })),
            })),
        );
    };

    const handleSubDistanceChange = (disciplineId: string, distanceId: string, subDistanceId: string, val: string) => {
        onChange(
            updateItem(disciplines, disciplineId, (d) => ({
                ...d,
                distances: updateItem(d.distances, distanceId, (dist) => ({
                    ...dist,
                    subDistances: patchItem(dist.subDistances || [], subDistanceId, { subDistance: val }),
                })),
            })),
        );
    };

    return (
        <Stack gap="sm">
            <Group justify="space-between" align="center" mt="xs">
                <Text fw={500} size="sm">
                    {t('disciplinesAndDistances')}
                </Text>
                <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconPlus size={16} />}
                    onClick={handleAddDiscipline}
                    disabled={disabled}
                >
                    {t('addDiscipline')}
                </Button>
            </Group>

            {disciplines.map((d) => (
                <Paper key={d.id} p="sm">
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
                        <DeleteActionButton onClick={() => handleRemoveDiscipline(d.id)} />
                    </Group>

                    <Stack gap="sm" mt="xs">
                        {d.distances.map((dist) => (
                            <Paper key={dist.id} p="xs" bg="var(--mantine-color-gray-light)">
                                <Group gap="xs" align="flex-end">
                                    <TextInput
                                        label={t('distanceMeters')}
                                        required
                                        flex={1}
                                        value={dist.distance}
                                        onChange={(e) => handleDistanceChange(d.id, dist.id, e.currentTarget.value)}
                                    />
                                    <DeleteActionButton onClick={() => handleRemoveDistance(d.id, dist.id)} />
                                </Group>

                                <Stack gap="xs" mt="xs" pl="sm" className="subdistances-container">
                                    <Group justify="space-between" align="center">
                                        <Text size="xs" fw={600} c="dimmed">
                                            {t('subDistances')}
                                        </Text>
                                        <Button
                                            size="compact-xs"
                                            variant="default"
                                            leftSection={<IconPlus size={16} />}
                                            onClick={() => handleAddSubDistance(d.id, dist.id)}
                                            disabled={disabled}
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
                                            <DeleteActionButton
                                                onClick={() => handleRemoveSubDistance(d.id, dist.id, sd.id)}
                                            />
                                        </Group>
                                    ))}
                                </Stack>
                            </Paper>
                        ))}

                        <Button
                            size="xs"
                            variant="default"
                            leftSection={<IconPlus size={16} />}
                            onClick={() => handleAddDistance(d.id)}
                            disabled={disabled}
                        >
                            {t('addDistance')}
                        </Button>
                    </Stack>
                </Paper>
            ))}
        </Stack>
    );
}
