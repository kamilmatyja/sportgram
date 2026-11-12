import { useState } from 'react';
import { Stack, Group, Paper, Select, TextInput, Button, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconPlayerPlay } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { updateItem, removeItem, patchItem, generateUuid } from '../../utils';
import { GpsDistanceRecorderPanel } from './GpsDistanceRecorderPanel';
import { DeleteActionButton } from '../common';

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
    onSessionTimes?: (times: { startedAt: Date; endedAt: Date }) => void;
}

interface ActiveRecordingSession {
    id: string;
    disciplineId: string;
}

export function TrainingDisciplinesEditor({ disciplines, onChange, onSessionTimes }: TrainingDisciplinesEditorProps) {
    const { t } = useTranslation();
    const [recordingSessions, setRecordingSessions] = useState<ActiveRecordingSession[]>([]);
    const [requestingGpsId, setRequestingGpsId] = useState<string | null>(null);

    const handleStartRecording = async (disciplineId: string) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            notifications.show({
                id: 'gps-status-error',
                color: 'red',
                title: t('gps'),
                message: t('gpsPermissionDenied'),
            });
            return;
        }

        if (navigator.permissions && navigator.permissions.query) {
            try {
                const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
                if (permissionStatus.state === 'denied') {
                    notifications.show({
                        id: 'gps-status-error',
                        color: 'red',
                        title: t('gps'),
                        message: t('gpsPermissionDenied'),
                    });
                    return;
                }
            } catch {
                void 0;
            }
        }

        setRequestingGpsId(disciplineId);

        navigator.geolocation.getCurrentPosition(
            () => {
                setRequestingGpsId(null);
                setRecordingSessions((prev) => [...prev, { id: generateUuid(), disciplineId }]);
            },
            (error) => {
                setRequestingGpsId(null);
                if (error.code === error.PERMISSION_DENIED) {
                    notifications.show({
                        id: 'gps-status-error',
                        color: 'red',
                        title: t('gps'),
                        message: t('gpsPermissionDenied'),
                    });
                } else {
                    const message = error.code === error.TIMEOUT ? t('gpsTimeout') : t('gpsPositionUnavailable');
                    notifications.show({
                        id: 'gps-status-error',
                        color: 'red',
                        title: t('gps'),
                        message,
                    });
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            },
        );
    };

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
                distances: [...d.distances, { id: generateUuid(), distance: '', time: '', subDistances: [] }],
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

    const handleDistanceChange = (
        disciplineId: string,
        distanceId: string,
        field: 'distance' | 'time',
        val: string,
    ) => {
        onChange(
            updateItem(disciplines, disciplineId, (d) => ({
                ...d,
                distances: patchItem(d.distances, distanceId, { [field]: val }),
            })),
        );
    };

    const handleAddSubDistance = (disciplineId: string, distanceId: string) => {
        onChange(
            updateItem(disciplines, disciplineId, (d) => ({
                ...d,
                distances: updateItem(d.distances, distanceId, (dist) => ({
                    ...dist,
                    subDistances: [
                        ...(dist.subDistances || []),
                        {
                            id: generateUuid(),
                            subDistance: '',
                            time: '',
                            lat: '',
                            lng: '',
                            accuracy: '',
                            speed: '',
                        },
                    ],
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

    const handleSubDistanceChange = (
        disciplineId: string,
        distanceId: string,
        subDistanceId: string,
        field: keyof FormTrainingSubDistance,
        val: string,
    ) => {
        onChange(
            updateItem(disciplines, disciplineId, (d) => ({
                ...d,
                distances: updateItem(d.distances, distanceId, (dist) => ({
                    ...dist,
                    subDistances: patchItem(dist.subDistances || [], subDistanceId, { [field]: val }),
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
                <Button size="xs" variant="light" leftSection={<IconPlus size={16} />} onClick={handleAddDiscipline}>
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
                                <Group grow gap="xs">
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
                                </Group>
                                <Group justify="flex-end" mt={4}>
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
                                        >
                                            {t('addSubDistance')}
                                        </Button>
                                    </Group>

                                    {dist.subDistances?.map((sd) => (
                                        <Paper key={sd.id} p="xs">
                                            <Stack gap="xs">
                                                <Group grow gap="xs">
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
                                                </Group>
                                                <Group grow gap="xs">
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
                                                </Group>
                                                <Group grow gap="xs">
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
                                                </Group>
                                            </Stack>
                                            <Group justify="flex-end" mt={4}>
                                                <DeleteActionButton
                                                    onClick={() => handleRemoveSubDistance(d.id, dist.id, sd.id)}
                                                />
                                            </Group>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Paper>
                        ))}

                        {recordingSessions
                            .filter((s) => s.disciplineId === d.id)
                            .map((session) => (
                                <GpsDistanceRecorderPanel
                                    key={session.id}
                                    onFinish={(newDist, times) => {
                                        onChange(
                                            updateItem(disciplines, d.id, (disc) => ({
                                                ...disc,
                                                distances: [...disc.distances, newDist],
                                            })),
                                        );
                                        onSessionTimes?.(times);
                                        setRecordingSessions((prev) => prev.filter((s) => s.id !== session.id));
                                    }}
                                    onCancel={() => {
                                        setRecordingSessions((prev) => prev.filter((s) => s.id !== session.id));
                                    }}
                                />
                            ))}

                        <Group grow gap="xs" mt="xs">
                            <Button
                                size="xs"
                                variant="light"
                                leftSection={<IconPlayerPlay size={16} />}
                                loading={requestingGpsId === d.id}
                                disabled={requestingGpsId !== null}
                                onClick={() => void handleStartRecording(d.id)}
                            >
                                {t('recordDistanceGps')}
                            </Button>
                            <Button
                                size="xs"
                                variant="default"
                                leftSection={<IconPlus size={16} />}
                                onClick={() => handleAddDistance(d.id)}
                            >
                                {t('addDistanceManually')}
                            </Button>
                        </Group>
                    </Stack>
                </Paper>
            ))}
        </Stack>
    );
}
