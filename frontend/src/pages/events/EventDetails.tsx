import { brown } from '../../theme';
import { useState, useMemo, useEffect } from 'react';
import {
    Card,
    Title,
    Text,
    Group,
    Button,
    Stack,
    Badge,
    Table,
    Image,
    Paper,
    ActionIcon,
    Tooltip,
    MantineThemeProvider,
    Center,
    Loader,
    Menu,
    Modal,
    TextInput,
    Textarea,
    FileInput,
    Select,
    SimpleGrid,
    Avatar,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import NotFound from '../../components/NotFound';
import { notifications } from '@mantine/notifications';
import {
    IconMapPin,
    IconClock,
    IconTrash,
    IconCheck,
    IconEdit,
    IconAdjustments,
    IconPlus,
    IconEye,
} from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { applyThemeColor } from '../../utils/themeUtils';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import {
    eventService,
    pageService,
    userService,
    type EventDisciplineDistanceResource,
    type EventDisciplineDistanceListResource,
    type EventDisciplineDistanceResultResource,
    type UserResource,
} from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { ColorEnum } from '../../enums/ColorEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { formatImageSrc, fileToBase64 } from '../../utils/imageUtils';
import { PageNav } from '../../components/PageNav';
import { openConfirmActionModal } from '../../utils/confirmModal';

interface FormEventSubDistance {
    id: string;
    subDistance: string;
}

interface FormEventDistance {
    id: string;
    distance: string;
    subDistances: FormEventSubDistance[];
}

interface FormEventDiscipline {
    id: string;
    discipline: string | null;
    distances: FormEventDistance[];
}

interface DistanceParticipantsProps {
    distance: EventDisciplineDistanceResource;
    isOwner: boolean;
    isParticipant: boolean;
    currentUserId?: string;
    onSignUp: (distId: string) => void;
    isSigningUp: boolean;
}

function DistanceParticipantsSection({
    distance,
    isOwner,
    isParticipant,
    currentUserId,
    onSignUp,
    isSigningUp,
}: DistanceParticipantsProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    // Add result modal
    const [addResultOpened, { open: openAddResult, close: closeAddResult }] = useDisclosure(false);
    const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
    const [resultTime, setResultTime] = useState('');
    const [subResultsTimes, setSubResultsTimes] = useState<string[]>([]);

    // Edit result modal
    const [editResultOpened, { open: openEditResult, close: closeEditResult }] = useDisclosure(false);
    const [editingResultId, setEditingResultId] = useState<string | null>(null);
    const [editResultTime, setEditResultTime] = useState('');
    const [editSubResultsTimes, setEditSubResultsTimes] = useState<string[]>([]);

    const { data: listData, isLoading } = useQuery({
        queryKey: ['distance-participants', distance.id],
        queryFn: async () => {
            return await eventService.getEventDisciplineDistances(distance.id, {
                'include[]': ['eventListResults', 'eventListSubResults'],
            });
        },
    });

    const participants = listData?.data ?? [];

    const participantUserIds = useMemo(() => {
        return Array.from(new Set(participants.map((p) => p.userId)));
    }, [participants]);

    const { data: usersData } = useQuery({
        queryKey: ['distance-users', participantUserIds],
        queryFn: async () => {
            if (participantUserIds.length === 0) return {};
            const users = await userService.getUsersByIds(participantUserIds);
            const map: Record<string, UserResource> = {};
            users.forEach((u) => {
                map[u.id] = u;
            });
            return map;
        },
        enabled: participantUserIds.length > 0,
    });

    const users = usersData ?? {};

    const isSignedUp = participants.some((p) => p.userId === currentUserId);

    const updateParticipantStatusMutation = useMutation({
        mutationFn: ({ participantId, status }: { participantId: string; status: ElementStatusEnum }) =>
            eventService.updateEventDisciplineDistanceListStatus(participantId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distance-participants', distance.id] });
            notifications.show({ title: t('participants'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const createResultMutation = useMutation({
        mutationFn: async () => {
            if (!selectedParticipantId) return;
            await eventService.createEventDisciplineDistanceResult(selectedParticipantId, {
                time: Math.round(Number(resultTime)) || 0,
                subResults: (distance.subDistances || [])
                    .map((sd, idx) => {
                        const val = subResultsTimes[idx];
                        if (!val || !val.trim()) return null;
                        return {
                            eventDisciplineSubDistanceId: sd.id,
                            time: Math.round(Number(val)) || 0,
                        };
                    })
                    .filter((sr): sr is { eventDisciplineSubDistanceId: string; time: number } => sr !== null),
            });
        },
        onSuccess: () => {
            closeAddResult();
            setSelectedParticipantId(null);
            setResultTime('');
            setSubResultsTimes([]);
            queryClient.invalidateQueries({ queryKey: ['distance-participants', distance.id] });
            notifications.show({ title: t('events'), message: t('resultAdded'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateResultMutation = useMutation({
        mutationFn: async () => {
            if (!editingResultId) return;
            await eventService.updateEventDisciplineDistanceResult(editingResultId, {
                time: Math.round(Number(editResultTime)) || 0,
                subResults: (distance.subDistances || [])
                    .map((sd, idx) => {
                        const val = editSubResultsTimes[idx];
                        if (!val || !val.trim()) return null;
                        return {
                            eventDisciplineSubDistanceId: sd.id,
                            time: Math.round(Number(val)) || 0,
                        };
                    })
                    .filter((sr): sr is { eventDisciplineSubDistanceId: string; time: number } => sr !== null),
            });
        },
        onSuccess: () => {
            closeEditResult();
            setEditingResultId(null);
            setEditResultTime('');
            setEditSubResultsTimes([]);
            queryClient.invalidateQueries({ queryKey: ['distance-participants', distance.id] });
            notifications.show({ title: t('events'), message: t('resultUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteResultMutation = useMutation({
        mutationFn: (resultId: string) => eventService.deleteEventDisciplineDistanceResult(resultId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distance-participants', distance.id] });
            notifications.show({ title: t('events'), message: t('deleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleOpenAddResult = (participantId: string) => {
        setSelectedParticipantId(participantId);
        setResultTime('');
        setSubResultsTimes((distance.subDistances || []).map(() => ''));
        openAddResult();
    };

    const handleOpenEditResult = (res: EventDisciplineDistanceResultResource) => {
        setEditingResultId(res.id);
        setEditResultTime(String(res.time ?? ''));
        setEditSubResultsTimes(res.subResults?.map((sr) => String(sr.time ?? '')) ?? []);
        openEditResult();
    };

    const handleDeleteResult = (resultId: string) => {
        openConfirmActionModal({
            title: t('confirmDeleteTitle'),
            message: t('confirmDeleteMessage'),
            confirmLabel: t('delete'),
            cancelLabel: t('cancel'),
            onConfirm: () => deleteResultMutation.mutate(resultId),
        });
    };

    return (
        <Paper p="sm" radius="sm" withBorder mb="sm">
            <Group justify="space-between" mb="xs">
                <Text fw={600} size="sm">
                    {distance.distance} m
                </Text>
                {isParticipant && !isSignedUp && (
                    <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconCheck size={16} />}
                        onClick={() => onSignUp(distance.id)}
                        loading={isSigningUp}
                        disabled={isSigningUp}
                    >
                        {t('saveUp')}
                    </Button>
                )}
            </Group>

            {isLoading ? (
                <Center h={60}>
                    <Loader size="xs" />
                </Center>
            ) : participants.length === 0 ? (
                <Text size="xs" c="dimmed">
                    {t('noData')}
                </Text>
            ) : (
                <Stack gap="sm">
                    <Table striped withTableBorder withColumnBorders>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>{t('user')}</Table.Th>
                                <Table.Th>{t('status')}</Table.Th>
                                <Table.Th ta="right">{t('actions')}</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {participants.map((p: EventDisciplineDistanceListResource) => {
                                const u = users[p.userId];
                                const isSelf = p.userId === currentUserId;
                                const canManageParticipant = isSelf || isOwner;
                                const pOpt = ElementStatusEnum.getOptions(t).find((o) => o.value === p.status);
                                const pColor =
                                    p.status === ElementStatusEnum.ACTIVE
                                        ? 'green'
                                        : p.status === ElementStatusEnum.REJECTED
                                          ? 'red'
                                          : 'gray';

                                return (
                                    <Table.Tr key={p.id}>
                                        <Table.Td>
                                            <Group gap="sm">
                                                <Avatar src={formatImageSrc(u?.profilePhoto)} radius={5} size="sm">
                                                    ?
                                                </Avatar>
                                                <div>
                                                    <Text size="xs" fw={600}>
                                                        {u ? `${u.firstName} ${u.lastName}` : p.userId}
                                                    </Text>
                                                    {u?.link && (
                                                        <Text size="10px" c="dimmed">
                                                            @{u.link}
                                                        </Text>
                                                    )}
                                                </div>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge size="xs" color={pColor} variant="light">
                                                {pOpt?.label ?? p.status}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td ta="right">
                                            <Group gap="xs" justify="flex-end" wrap="nowrap">
                                                {u?.link && (
                                                    <Tooltip label={t('details')} withArrow>
                                                        <ActionIcon
                                                            component={Link}
                                                            to={`/users/${u.link}`}
                                                            variant="light"
                                                            size={26}
                                                            aria-label={t('details')}
                                                        >
                                                            <IconEye size={14} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                )}
                                                {canManageParticipant && (
                                                    <Menu shadow="md" width={160}>
                                                        <Menu.Target>
                                                            <Tooltip label={t('changeStatus')} withArrow>
                                                                <ActionIcon
                                                                    variant="light"
                                                                    size={26}
                                                                    aria-label={t('changeStatus')}
                                                                >
                                                                    <IconAdjustments size={14} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        </Menu.Target>
                                                        <Menu.Dropdown>
                                                            {ElementStatusEnum.getOptions(t).map((opt) => (
                                                                <Menu.Item
                                                                    key={opt.value}
                                                                    disabled={
                                                                        p.status === opt.value ||
                                                                        updateParticipantStatusMutation.isPending
                                                                    }
                                                                    onClick={() =>
                                                                        updateParticipantStatusMutation.mutate({
                                                                            participantId: p.id,
                                                                            status: opt.value as ElementStatusEnum,
                                                                        })
                                                                    }
                                                                >
                                                                    {opt.label}
                                                                </Menu.Item>
                                                            ))}
                                                        </Menu.Dropdown>
                                                    </Menu>
                                                )}
                                                {isOwner && (
                                                    <Button
                                                        size="compact-xs"
                                                        variant="subtle"
                                                        leftSection={<IconPlus size={14} />}
                                                        onClick={() => handleOpenAddResult(p.id)}
                                                    >
                                                        {t('addResult')}
                                                    </Button>
                                                )}
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>

                    {/* Sub-results / Results Section */}
                    {participants.some((p) => p.results && p.results.length > 0) && (
                        <Stack gap="xs" pl="sm">
                            <Text size="xs" fw={700} c="dimmed">
                                {t('results')}
                            </Text>
                            {participants.map((p) => {
                                if (!p.results || p.results.length === 0) return null;
                                const u = users[p.userId];

                                return (
                                    <Paper key={p.id} p="xs" radius="xs" withBorder>
                                        <Text size="xs" fw={600} mb={4}>
                                            {u ? `${u.firstName} ${u.lastName}` : p.userId}
                                        </Text>
                                        <Table striped withTableBorder>
                                            <Table.Thead>
                                                <Table.Tr>
                                                    <Table.Th>{t('timeSeconds')}</Table.Th>
                                                    <Table.Th>{t('subDistances')}</Table.Th>
                                                    <Table.Th ta="right">{t('actions')}</Table.Th>
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {p.results.map((res: EventDisciplineDistanceResultResource) => (
                                                    <Table.Tr key={res.id}>
                                                        <Table.Td>{res.time} s</Table.Td>
                                                        <Table.Td>
                                                            {res.subResults && res.subResults.length > 0 ? (
                                                                <Group gap={4}>
                                                                    {res.subResults.map((sr, idx) => (
                                                                        <Badge key={sr.id} size="xs" variant="outline">
                                                                            #{idx + 1}: {sr.time}s
                                                                        </Badge>
                                                                    ))}
                                                                </Group>
                                                            ) : (
                                                                '-'
                                                            )}
                                                        </Table.Td>
                                                        <Table.Td ta="right">
                                                            {isOwner && (
                                                                <Group gap="xs" justify="flex-end" wrap="nowrap">
                                                                    <Tooltip label={t('editResult')} withArrow>
                                                                        <ActionIcon
                                                                            variant="light"
                                                                            size={24}
                                                                            onClick={() => handleOpenEditResult(res)}
                                                                            aria-label={t('editResult')}
                                                                        >
                                                                            <IconEdit size={14} />
                                                                        </ActionIcon>
                                                                    </Tooltip>
                                                                    <Tooltip label={t('delete')} withArrow>
                                                                        <ActionIcon
                                                                            variant="light"
                                                                            color="red"
                                                                            size={24}
                                                                            onClick={() => handleDeleteResult(res.id)}
                                                                            aria-label={t('delete')}
                                                                        >
                                                                            <IconTrash size={14} />
                                                                        </ActionIcon>
                                                                    </Tooltip>
                                                                </Group>
                                                            )}
                                                        </Table.Td>
                                                    </Table.Tr>
                                                ))}
                                            </Table.Tbody>
                                        </Table>
                                    </Paper>
                                );
                            })}
                        </Stack>
                    )}
                </Stack>
            )}

            {/* Add Result Modal */}
            <Modal opened={addResultOpened} onClose={closeAddResult} title={t('addResult')} size="sm">
                <Stack gap="sm">
                    <TextInput
                        label={t('timeSeconds')}
                        required
                        type="number"
                        value={resultTime}
                        onChange={(e) => setResultTime(e.currentTarget.value)}
                    />

                    {distance.subDistances && distance.subDistances.length > 0 && (
                        <Stack gap="xs">
                            <Text size="xs" fw={600}>
                                {t('subDistances')}
                            </Text>
                            {distance.subDistances.map((sd, idx) => (
                                <TextInput
                                    key={sd.id}
                                    size="xs"
                                    label={`${sd.subDistance} m (${t('timeSeconds')})`}
                                    type="number"
                                    value={subResultsTimes[idx] ?? ''}
                                    onChange={(e) => {
                                        const newTimes = [...subResultsTimes];
                                        newTimes[idx] = e.currentTarget.value;
                                        setSubResultsTimes(newTimes);
                                    }}
                                />
                            ))}
                        </Stack>
                    )}

                    <Button
                        mt="xs"
                        loading={createResultMutation.isPending}
                        disabled={createResultMutation.isPending || !resultTime.trim()}
                        onClick={() => createResultMutation.mutate()}
                    >
                        {t('add')}
                    </Button>
                </Stack>
            </Modal>

            {/* Edit Result Modal */}
            <Modal opened={editResultOpened} onClose={closeEditResult} title={t('editResult')} size="sm">
                <Stack gap="sm">
                    <TextInput
                        label={t('timeSeconds')}
                        required
                        type="number"
                        value={editResultTime}
                        onChange={(e) => setEditResultTime(e.currentTarget.value)}
                    />

                    {distance.subDistances && distance.subDistances.length > 0 && (
                        <Stack gap="xs">
                            <Text size="xs" fw={600}>
                                {t('subDistances')}
                            </Text>
                            {distance.subDistances.map((sd, idx) => (
                                <TextInput
                                    key={sd.id}
                                    size="xs"
                                    label={`${sd.subDistance} m (${t('timeSeconds')})`}
                                    type="number"
                                    value={editSubResultsTimes[idx] ?? ''}
                                    onChange={(e) => {
                                        const newTimes = [...editSubResultsTimes];
                                        newTimes[idx] = e.currentTarget.value;
                                        setEditSubResultsTimes(newTimes);
                                    }}
                                />
                            ))}
                        </Stack>
                    )}

                    <Button
                        mt="xs"
                        loading={updateResultMutation.isPending}
                        disabled={updateResultMutation.isPending || !editResultTime.trim()}
                        onClick={() => updateResultMutation.mutate()}
                    >
                        {t('saveChanges')}
                    </Button>
                </Stack>
            </Modal>
        </Paper>
    );
}

export default function EventDetails() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { currentUser, isParticipant, isAdmin } = useAuth();

    // Edit modal
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
    const [editFormData, setEditFormData] = useState({
        title: '',
        description: '',
        link: '',
        location: '',
        rules: '',
        startedAt: '',
        endedAt: '',
    });
    const [editDisciplines, setEditDisciplines] = useState<FormEventDiscipline[]>([]);
    const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});

    const { data: event, isLoading: eventLoading } = useQuery({
        queryKey: ['event', link],
        queryFn: () => eventService.getEventByLink(link || ''),
        enabled: !!link,
    });

    const { data: pagesData } = useQuery({
        queryKey: ['pages-with-participants'],
        queryFn: () => pageService.getPages({ limit: 100, 'include[]': ['pageParticipants'] }),
        enabled: !!event?.pageParticipantId,
    });

    const page = useMemo(() => {
        if (!event?.pageParticipantId || !pagesData?.data) return null;
        return pagesData.data.find((p) => p.participants?.some((part) => part.id === event.pageParticipantId)) ?? null;
    }, [event?.pageParticipantId, pagesData]);

    const isOwner =
        isAdmin ||
        page?.userId === currentUser?.id ||
        (page?.participants?.some((p) => p.id === event?.pageParticipantId && p.userId === currentUser?.id) ?? false);

    // Sign up for distance mutation
    const signUpMutation = useMutation({
        mutationFn: (distanceId: string) => eventService.signUpForDistance(distanceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['distance-participants'] });
            notifications.show({ title: t('events'), message: t('signedUpForStartList'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    // Discipline helper handlers for edit modal
    const handleAddEditDiscipline = () => {
        setEditDisciplines((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                discipline: null,
                distances: [{ id: crypto.randomUUID(), distance: '', subDistances: [] }],
            },
        ]);
    };

    const handleRemoveEditDiscipline = (id: string) => {
        setEditDisciplines((prev) => prev.filter((d) => d.id !== id));
    };

    const handleEditDisciplineChange = (id: string, value: string | null) => {
        setEditDisciplines((prev) => prev.map((d) => (d.id === id ? { ...d, discipline: value } : d)));
    };

    const handleAddEditDistance = (discId: string) => {
        setEditDisciplines((prev) =>
            prev.map((d) => {
                if (d.id !== discId) return d;
                return {
                    ...d,
                    distances: [...d.distances, { id: crypto.randomUUID(), distance: '', subDistances: [] }],
                };
            }),
        );
    };

    const handleRemoveEditDistance = (discId: string, distId: string) => {
        setEditDisciplines((prev) =>
            prev.map((d) => {
                if (d.id !== discId) return d;
                return {
                    ...d,
                    distances: d.distances.filter((dist) => dist.id !== distId),
                };
            }),
        );
    };

    const handleEditDistanceChange = (discId: string, distId: string, value: string) => {
        setEditDisciplines((prev) =>
            prev.map((d) => {
                if (d.id !== discId) return d;
                return {
                    ...d,
                    distances: d.distances.map((dist) => (dist.id === distId ? { ...dist, distance: value } : dist)),
                };
            }),
        );
    };

    const handleAddEditSubDistance = (discId: string, distId: string) => {
        setEditDisciplines((prev) =>
            prev.map((d) => {
                if (d.id !== discId) return d;
                return {
                    ...d,
                    distances: d.distances.map((dist) => {
                        if (dist.id !== distId) return dist;
                        return {
                            ...dist,
                            subDistances: [...(dist.subDistances || []), { id: crypto.randomUUID(), subDistance: '' }],
                        };
                    }),
                };
            }),
        );
    };

    const handleRemoveEditSubDistance = (discId: string, distId: string, subDistId: string) => {
        setEditDisciplines((prev) =>
            prev.map((d) => {
                if (d.id !== discId) return d;
                return {
                    ...d,
                    distances: d.distances.map((dist) => {
                        if (dist.id !== distId) return dist;
                        return {
                            ...dist,
                            subDistances: (dist.subDistances || []).filter((sd) => sd.id !== subDistId),
                        };
                    }),
                };
            }),
        );
    };

    const handleEditSubDistanceChange = (discId: string, distId: string, subDistId: string, value: string) => {
        setEditDisciplines((prev) =>
            prev.map((d) => {
                if (d.id !== discId) return d;
                return {
                    ...d,
                    distances: d.distances.map((dist) => {
                        if (dist.id !== distId) return dist;
                        return {
                            ...dist,
                            subDistances: (dist.subDistances || []).map((sd) =>
                                sd.id === subDistId ? { ...sd, subDistance: value } : sd,
                            ),
                        };
                    }),
                };
            }),
        );
    };

    const handleOpenEdit = () => {
        if (!event) return;
        setEditPhotoFile(null);
        setEditFormData({
            title: event.title || '',
            description: event.description || '',
            link: event.link || '',
            location: event.location || '',
            rules: event.rules || '',
            startedAt: event.startedAt ? event.startedAt.slice(0, 16) : '',
            endedAt: event.endedAt ? event.endedAt.slice(0, 16) : '',
        });
        setEditDisciplines(
            (event.disciplines || []).map((d) => ({
                id: d.id || crypto.randomUUID(),
                discipline: d.discipline !== undefined ? String(d.discipline) : null,
                distances: (d.distances || []).map((dist) => ({
                    id: dist.id || crypto.randomUUID(),
                    distance: String(dist.distance ?? ''),
                    subDistances: (dist.subDistances || []).map((sd) => ({
                        id: sd.id || crypto.randomUUID(),
                        subDistance: String(sd.subDistance ?? ''),
                    })),
                })),
            })),
        );
        setEditFieldErrors({});
        openEdit();
    };

    const updateEventMutation = useMutation({
        mutationFn: async () => {
            if (!event) return;
            let photoStr = event.photo;
            if (editPhotoFile) {
                photoStr = await fileToBase64(editPhotoFile);
            }
            await eventService.updateEvent(event.id, {
                title: editFormData.title,
                description: editFormData.description,
                link: editFormData.link,
                location: editFormData.location,
                rules: editFormData.rules,
                startedAt: editFormData.startedAt,
                endedAt: editFormData.endedAt,
                photo: photoStr,
                disciplines: editDisciplines.map((d) => ({
                    discipline: Number(d.discipline) as DisciplineEnum,
                    distances: d.distances.map((dist) => ({
                        distance: Math.round(Number(dist.distance)) || 0,
                        subDistances: (dist.subDistances || []).map((sd) => ({
                            subDistance: Math.round(Number(sd.subDistance)) || 0,
                        })),
                    })),
                })),
            });
        },
        onSuccess: () => {
            closeEdit();
            setEditFieldErrors({});
            queryClient.invalidateQueries({ queryKey: ['event', link] });
            notifications.show({ title: t('events'), message: t('eventUpdated'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setEditFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const statusMutation = useMutation({
        mutationFn: (status: ElementStatusEnum) => {
            if (!event?.id) throw new Error('No event');
            return eventService.updateEventStatus(event.id, status);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['event', link] });
            notifications.show({ title: t('events'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!event?.id) return;
            await eventService.deleteEvent(event.id);
        },
        onSuccess: () => {
            notifications.show({ title: t('events'), message: t('eventDeleted'), color: 'green' });
            navigate('/events');
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleDelete = () => {
        openConfirmActionModal({
            title: t('confirmDeleteTitle'),
            message: t('confirmDeleteMessage'),
            confirmLabel: t('delete'),
            cancelLabel: t('cancel'),
            onConfirm: () => deleteMutation.mutate(),
        });
    };

    const primaryColor = ColorEnum.getMantineColor(page?.color);

    useEffect(() => {
        if (!primaryColor) return;
        applyThemeColor(primaryColor);
        return () => {
            applyThemeColor('blue');
        };
    }, [primaryColor]);

    if (eventLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!event) {
        return <NotFound title={t('eventNotFound')} />;
    }

    const eventPhotoSrc = formatImageSrc(event.photo);

    const eventStatusOpt = ElementStatusEnum.getOptions(t).find((o) => o.value === event.status);
    const eventStatusColor =
        event.status === ElementStatusEnum.ACTIVE
            ? 'green'
            : event.status === ElementStatusEnum.REJECTED
              ? 'red'
              : 'gray';

    const canSubmitEdit =
        editFormData.title.trim().length > 0 &&
        editFormData.link.trim().length > 0 &&
        editFormData.location.trim().length > 0 &&
        editFormData.startedAt.length > 0 &&
        editFormData.endedAt.length > 0 &&
        editFormData.description.trim().length > 0 &&
        editFormData.rules.trim().length > 0 &&
        editDisciplines.length > 0 &&
        editDisciplines.every(
            (d) =>
                d.discipline !== null &&
                d.distances.length > 0 &&
                d.distances.every((dist) => dist.distance.trim().length > 0),
        );

    return (
        <MantineThemeProvider theme={{ primaryColor, colors: { brown } }} inherit>
            <Stack gap="lg">
                {page && <PageNav page={page} />}

                <Card withBorder radius="md" p="lg" shadow="xs">
                    {eventPhotoSrc && (
                        <Image src={eventPhotoSrc} alt={event.title} radius="md" mah={300} fit="cover" mb="md" />
                    )}

                    <Group justify="space-between" align="flex-start" mb="md" wrap="nowrap">
                        <div>
                            <Title order={2}>{event.title}</Title>
                            <Group gap="xs" mt="xs">
                                <IconMapPin size={16} />
                                <Text size="sm" c="dimmed">
                                    {event.location || '-'}
                                </Text>
                            </Group>
                            <Group gap="xs" mt={4}>
                                <IconClock size={16} />
                                <Text size="xs" c="dimmed">
                                    {event.startedAt ? new Date(event.startedAt).toLocaleString() : ''} -{' '}
                                    {event.endedAt ? new Date(event.endedAt).toLocaleString() : ''}
                                </Text>
                            </Group>
                        </div>

                        <Group gap="xs" wrap="nowrap">
                            {isOwner && (
                                <>
                                    <Menu shadow="md" width={160}>
                                        <Menu.Target>
                                            <Tooltip label={t('changeStatus')} withArrow>
                                                <ActionIcon variant="light" size={32} aria-label={t('changeStatus')}>
                                                    <IconAdjustments size={18} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            {ElementStatusEnum.getOptions(t).map((opt) => (
                                                <Menu.Item
                                                    key={opt.value}
                                                    disabled={event.status === opt.value || statusMutation.isPending}
                                                    onClick={() => statusMutation.mutate(opt.value)}
                                                >
                                                    {opt.label}
                                                </Menu.Item>
                                            ))}
                                        </Menu.Dropdown>
                                    </Menu>

                                    <Tooltip label={t('editEvent')} withArrow>
                                        <ActionIcon
                                            variant="light"
                                            size={32}
                                            onClick={handleOpenEdit}
                                            aria-label={t('editEvent')}
                                        >
                                            <IconEdit size={18} />
                                        </ActionIcon>
                                    </Tooltip>

                                    <Tooltip label={t('delete')} withArrow>
                                        <ActionIcon
                                            variant="light"
                                            color="red"
                                            size={32}
                                            onClick={handleDelete}
                                            loading={deleteMutation.isPending}
                                            disabled={deleteMutation.isPending}
                                            aria-label={t('delete')}
                                        >
                                            <IconTrash size={18} />
                                        </ActionIcon>
                                    </Tooltip>
                                </>
                            )}
                        </Group>
                    </Group>

                    <Group gap="sm" mb="md">
                        <Badge size="lg" color={eventStatusColor} variant="filled">
                            {eventStatusOpt?.label ?? event.status}
                        </Badge>
                    </Group>

                    {event.description && (
                        <Text size="sm" mb="md" className="pre-wrap">
                            {event.description}
                        </Text>
                    )}

                    {event.rules && (
                        <Paper withBorder p="sm" radius="sm" mb="md">
                            <Text size="xs" fw={700} c="dimmed" mb={4}>
                                {t('rules')}
                            </Text>
                            <Text size="xs" className="pre-wrap">
                                {event.rules}
                            </Text>
                        </Paper>
                    )}

                    {/* Disciplines Hierarchy with Distances, Participants & Results */}
                    <Title order={4} mb="sm">
                        {t('disciplinesAndDistances')}
                    </Title>

                    <Stack gap="md">
                        {event.disciplines?.map((disc) => (
                            <Paper key={disc.id} withBorder p="md" radius="md">
                                <Badge size="md" mb="sm">
                                    {DisciplineEnum.getOptions(t).find((o) => o.value === disc.discipline)?.label ??
                                        disc.discipline}
                                </Badge>

                                <Stack gap="xs">
                                    {disc.distances?.map((dist) => (
                                        <DistanceParticipantsSection
                                            key={dist.id}
                                            distance={dist}
                                            isOwner={isOwner}
                                            isParticipant={isParticipant}
                                            currentUserId={currentUser?.id}
                                            onSignUp={(dId) => signUpMutation.mutate(dId)}
                                            isSigningUp={signUpMutation.isPending}
                                        />
                                    ))}
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>
                </Card>

                {/* Edit modal */}
                <Modal opened={editOpened} onClose={closeEdit} title={t('editEvent')} size="lg">
                    <Stack gap="sm">
                        <TextInput
                            label={t('title')}
                            required
                            value={editFormData.title}
                            error={editFieldErrors.title}
                            onChange={(e) => {
                                const titleVal = e.currentTarget.value;
                                const linkVal = titleVal
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, '-')
                                    .replace(/(^-|-$)/g, '');
                                setEditFormData({ ...editFormData, title: titleVal, link: linkVal });
                            }}
                        />

                        <TextInput
                            label={t('link')}
                            required
                            value={editFormData.link}
                            error={editFieldErrors.link}
                            onChange={(e) => setEditFormData({ ...editFormData, link: e.currentTarget.value })}
                        />

                        <TextInput
                            label={t('location')}
                            required
                            value={editFormData.location}
                            error={editFieldErrors.location}
                            onChange={(e) => setEditFormData({ ...editFormData, location: e.currentTarget.value })}
                        />

                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                            <TextInput
                                label={t('startedAt')}
                                type="datetime-local"
                                required
                                value={editFormData.startedAt}
                                error={editFieldErrors.startedAt}
                                onChange={(e) => setEditFormData({ ...editFormData, startedAt: e.currentTarget.value })}
                            />
                            <TextInput
                                label={t('endedAt')}
                                type="datetime-local"
                                required
                                value={editFormData.endedAt}
                                error={editFieldErrors.endedAt}
                                onChange={(e) => setEditFormData({ ...editFormData, endedAt: e.currentTarget.value })}
                            />
                        </SimpleGrid>

                        <FileInput
                            label={t('photo')}
                            placeholder={t('selectPhotoPlaceholder')}
                            description={t('leaveEmptyToKeep')}
                            accept="image/*"
                            value={editPhotoFile}
                            error={editFieldErrors.photo}
                            onChange={setEditPhotoFile}
                            clearable
                        />

                        <Group justify="space-between" align="center" mt="xs">
                            <Text fw={500} size="sm">
                                {t('disciplinesAndDistances')}
                            </Text>
                            <Button
                                size="xs"
                                variant="light"
                                leftSection={<IconPlus size={16} />}
                                onClick={handleAddEditDiscipline}
                            >
                                {t('addDiscipline')}
                            </Button>
                        </Group>

                        <Stack gap="sm">
                            {editDisciplines.map((d) => (
                                <Paper key={d.id} withBorder p="sm" radius="md">
                                    <Group justify="space-between" align="flex-end" mb="xs">
                                        <Select
                                            label={t('discipline')}
                                            placeholder={t('discipline')}
                                            required
                                            clearable
                                            data={DisciplineEnum.getOptions(t).map((opt) => ({
                                                value: String(opt.value),
                                                label: opt.label,
                                            }))}
                                            value={d.discipline}
                                            onChange={(val) => handleEditDisciplineChange(d.id, val)}
                                            flex={1}
                                        />
                                        <Button
                                            size="xs"
                                            color="red"
                                            variant="subtle"
                                            leftSection={<IconTrash size={16} />}
                                            onClick={() => handleRemoveEditDiscipline(d.id)}
                                        >
                                            {t('delete')}
                                        </Button>
                                    </Group>

                                    <Stack gap="sm" mt="xs">
                                        {d.distances.map((dist) => (
                                            <Paper
                                                key={dist.id}
                                                p="xs"
                                                radius="sm"
                                                withBorder
                                                bg="var(--mantine-color-gray-light)"
                                            >
                                                <Group gap="xs" align="flex-end">
                                                    <TextInput
                                                        label={t('distanceMeters')}
                                                        required
                                                        flex={1}
                                                        value={dist.distance}
                                                        onChange={(e) =>
                                                            handleEditDistanceChange(
                                                                d.id,
                                                                dist.id,
                                                                e.currentTarget.value,
                                                            )
                                                        }
                                                    />
                                                    <ActionIcon
                                                        color="red"
                                                        variant="light"
                                                        size={30}
                                                        onClick={() => handleRemoveEditDistance(d.id, dist.id)}
                                                        title={t('delete')}
                                                    >
                                                        <IconTrash size={16} />
                                                    </ActionIcon>
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
                                                            onClick={() => handleAddEditSubDistance(d.id, dist.id)}
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
                                                                    handleEditSubDistanceChange(
                                                                        d.id,
                                                                        dist.id,
                                                                        sd.id,
                                                                        e.currentTarget.value,
                                                                    )
                                                                }
                                                            />
                                                            <ActionIcon
                                                                color="red"
                                                                variant="subtle"
                                                                size={30}
                                                                onClick={() =>
                                                                    handleRemoveEditSubDistance(d.id, dist.id, sd.id)
                                                                }
                                                                title={t('delete')}
                                                            >
                                                                <IconTrash size={16} />
                                                            </ActionIcon>
                                                        </Group>
                                                    ))}
                                                </Stack>
                                            </Paper>
                                        ))}

                                        <Button
                                            size="xs"
                                            variant="subtle"
                                            leftSection={<IconPlus size={16} />}
                                            onClick={() => handleAddEditDistance(d.id)}
                                        >
                                            {t('addDistance')}
                                        </Button>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>

                        <Textarea
                            label={t('description')}
                            required
                            rows={2}
                            value={editFormData.description}
                            error={editFieldErrors.description}
                            onChange={(e) => setEditFormData({ ...editFormData, description: e.currentTarget.value })}
                        />

                        <Textarea
                            label={t('rules')}
                            required
                            rows={2}
                            value={editFormData.rules}
                            error={editFieldErrors.rules}
                            onChange={(e) => setEditFormData({ ...editFormData, rules: e.currentTarget.value })}
                        />

                        <Button
                            mt="md"
                            loading={updateEventMutation.isPending}
                            disabled={updateEventMutation.isPending || !canSubmitEdit}
                            onClick={() => updateEventMutation.mutate()}
                        >
                            {t('saveChanges')}
                        </Button>
                    </Stack>
                </Modal>
            </Stack>
        </MantineThemeProvider>
    );
}
