import { useState, useMemo, useEffect } from 'react';
import {
    Card,
    Title,
    Text,
    Group,
    Stack,
    Badge,
    Table,
    Paper,
    ActionIcon,
    Tooltip,
    MantineThemeProvider,
    Center,
    Loader,
    Button,
    Menu,
    Modal,
    TextInput,
    Textarea,
    Select,
    MultiSelect,
    SimpleGrid,
    Avatar,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconMapPin, IconClock, IconEdit, IconAdjustments, IconPlus, IconEye } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { applyThemeColor } from '../../utils/themeUtils';
import NotFound from '../../components/NotFound';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import {
    trainingService,
    userService,
    friendService,
    type UserResource,
    type TrainingParticipantResource,
    type TrainingDisciplineResource,
    type TrainingDisciplineDistanceResource,
    type TrainingDisciplineSubDistanceResource,
} from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { useUserSubpageAccess } from '../../hooks/useUserSubpageAccess';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { ColorEnum } from '../../enums/ColorEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import UserProfileNav from '../../components/UserProfileNav';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { brown } from '../../theme';
import { formatImageSrc } from '../../utils/imageUtils';

interface FormTrainingSubDistance {
    id: string;
    subDistance: string;
    time: string;
    lat: string;
    lng: string;
    accuracy: string;
    speed: string;
}

interface FormTrainingDistance {
    id: string;
    distance: string;
    time: string;
    subDistances: FormTrainingSubDistance[];
}

interface FormTrainingDiscipline {
    id: string;
    discipline: string | null;
    distances: FormTrainingDistance[];
}

export default function TrainingDetails() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    // Edit modal
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [editCollaboratorIds, setEditCollaboratorIds] = useState<string[]>([]);
    const [editFormData, setEditFormData] = useState({
        title: '',
        description: '',
        link: '',
        location: '',
        startedAt: '',
        endedAt: '',
    });
    const [editDisciplines, setEditDisciplines] = useState<FormTrainingDiscipline[]>([]);
    const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});

    const { data: training, isLoading: trainingLoading } = useQuery({
        queryKey: ['training', link],
        queryFn: () => trainingService.getTrainingByLink(link || ''),
        enabled: !!link,
    });

    const { data: ownerUserData, isLoading: userLoading } = useQuery({
        queryKey: ['user', training?.userId],
        queryFn: () => (training?.userId ? userService.getUser(training.userId) : null),
        enabled: !!training?.userId,
    });

    const ownerUser = ownerUserData?.data ?? null;

    const {
        isOwner,
        isAdmin,
        canAccessSubpage,
        isLoading: accessLoading,
    } = useUserSubpageAccess({
        targetUser: ownerUser,
    });

    const canManage = isOwner || isAdmin;

    // Fetch participant users info
    const participantUserIds = useMemo(() => {
        if (!training?.participants) return [];
        return Array.from(new Set(training.participants.map((p) => p.userId)));
    }, [training?.participants]);

    const { data: participantUsersData } = useQuery({
        queryKey: ['training-participant-users', participantUserIds],
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

    const participantUsers = participantUsersData ?? {};

    // Fetch friends for collaborator select in edit modal
    const { data: myFriendsData } = useQuery({
        queryKey: ['my-accepted-friends', currentUser?.id],
        queryFn: async () => {
            if (!currentUser?.id) return [];
            const res = await friendService.getFriends({
                limit: 100,
                filter: { userIds: [currentUser.id], status: FriendStatusEnum.ACCEPTED },
            });
            return res.data ?? [];
        },
        enabled: !!currentUser?.id && canManage,
    });

    const friendUserIds = useMemo(() => {
        if (!myFriendsData || !currentUser) return [];
        return myFriendsData.map((f) => (f.senderUserId === currentUser.id ? f.receiverUserId : f.senderUserId));
    }, [myFriendsData, currentUser]);

    const { data: friendUsers } = useQuery({
        queryKey: ['friend-users-details', friendUserIds],
        queryFn: async () => {
            if (friendUserIds.length === 0) return [];
            return await userService.getUsersByIds(friendUserIds);
        },
        enabled: friendUserIds.length > 0 && canManage,
    });

    const collaboratorOptions = useMemo(() => {
        if (!friendUsers) return [];
        return friendUsers.map((u) => ({
            value: u.id,
            label: `${u.firstName} ${u.lastName} (@${u.link})`,
        }));
    }, [friendUsers]);

    // Discipline helper handlers for edit modal
    const handleAddEditDiscipline = () => {
        setEditDisciplines((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                discipline: null,
                distances: [{ id: crypto.randomUUID(), distance: '', time: '', subDistances: [] }],
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
                    distances: [...d.distances, { id: crypto.randomUUID(), distance: '', time: '', subDistances: [] }],
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

    const handleEditDistanceChange = (discId: string, distId: string, field: 'distance' | 'time', value: string) => {
        setEditDisciplines((prev) =>
            prev.map((d) => {
                if (d.id !== discId) return d;
                return {
                    ...d,
                    distances: d.distances.map((dist) => (dist.id === distId ? { ...dist, [field]: value } : dist)),
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

    const handleEditSubDistanceChange = (
        discId: string,
        distId: string,
        subDistId: string,
        field: keyof FormTrainingSubDistance,
        value: string,
    ) => {
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
                                sd.id === subDistId ? { ...sd, [field]: value } : sd,
                            ),
                        };
                    }),
                };
            }),
        );
    };

    const handleOpenEdit = () => {
        if (!training) return;
        setEditCollaboratorIds(
            training.participants?.map((p) => p.userId).filter((id) => id !== currentUser?.id) ?? [],
        );
        setEditFormData({
            title: training.title || '',
            description: training.description || '',
            link: training.link || '',
            location: training.location || '',
            startedAt: training.startedAt ? training.startedAt.slice(0, 16) : '',
            endedAt: training.endedAt ? training.endedAt.slice(0, 16) : '',
        });
        setEditDisciplines(
            (training.disciplines || []).map((d) => ({
                id: d.id || crypto.randomUUID(),
                discipline: d.discipline !== undefined ? String(d.discipline) : null,
                distances: (d.distances || []).map((dist) => ({
                    id: dist.id || crypto.randomUUID(),
                    distance: String(dist.distance ?? ''),
                    time: String(dist.time ?? ''),
                    subDistances: (dist.subDistances || []).map((sd) => ({
                        id: sd.id || crypto.randomUUID(),
                        subDistance: String(sd.subDistance ?? ''),
                        time: String(sd.time ?? ''),
                        lat: sd.lat != null ? String(sd.lat) : '',
                        lng: sd.lng != null ? String(sd.lng) : '',
                        accuracy: sd.accuracy != null ? String(sd.accuracy) : '',
                        speed: sd.speed != null ? String(sd.speed) : '',
                    })),
                })),
            })),
        );
        setEditFieldErrors({});
        openEdit();
    };

    const updateTrainingMutation = useMutation({
        mutationFn: async () => {
            if (!training) return;
            if (editDisciplines.length === 0) throw new Error(t('discipline') + ' ' + t('required'));
            await trainingService.updateTraining(training.id, {
                title: editFormData.title,
                description: editFormData.description,
                link: editFormData.link,
                location: editFormData.location,
                startedAt: editFormData.startedAt,
                endedAt: editFormData.endedAt,
                userIds: Array.from(new Set([currentUser?.id ?? '', ...editCollaboratorIds])).filter(Boolean),
                disciplines: editDisciplines.map((d) => ({
                    discipline: Number(d.discipline) as DisciplineEnum,
                    distances: d.distances.map((dist) => ({
                        distance: Math.round(Number(dist.distance)) || 0,
                        time: Math.round(Number(dist.time)) || 0,
                        subDistances: (dist.subDistances || []).map((sd) => ({
                            subDistance: Math.round(Number(sd.subDistance)) || 0,
                            time: Math.round(Number(sd.time)) || 0,
                            lat: sd.lat !== '' && !isNaN(Number(sd.lat)) ? Math.round(Number(sd.lat)) : null,
                            lng: sd.lng !== '' && !isNaN(Number(sd.lng)) ? Math.round(Number(sd.lng)) : null,
                            accuracy:
                                sd.accuracy !== '' && !isNaN(Number(sd.accuracy))
                                    ? Math.round(Number(sd.accuracy))
                                    : null,
                            speed: sd.speed !== '' && !isNaN(Number(sd.speed)) ? Math.round(Number(sd.speed)) : null,
                        })),
                    })),
                })),
            });
        },
        onSuccess: () => {
            closeEdit();
            setEditFieldErrors({});
            queryClient.invalidateQueries({ queryKey: ['training', link] });
            notifications.show({ title: t('trainings'), message: t('trainingUpdated'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setEditFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: (status: ElementStatusEnum) => {
            if (!training?.id) throw new Error('No training');
            return trainingService.updateTrainingStatus(training.id, status);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['training', link] });
            notifications.show({ title: t('trainings'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateParticipantStatusMutation = useMutation({
        mutationFn: ({ participantId, status }: { participantId: string; status: SaveStatusEnum }) =>
            trainingService.updateTrainingParticipantStatus(participantId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['training', link] });
            notifications.show({ title: t('participants'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!training?.id) return;
            await trainingService.deleteTraining(training.id);
        },
        onSuccess: () => {
            notifications.show({ title: t('trainings'), message: t('trainingDeleted'), color: 'green' });
            navigate(ownerUser?.link ? `/users/${ownerUser.link}/trainings` : (-1 as unknown as string));
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

    const primaryColor = ColorEnum.getMantineColor(ownerUser?.color);

    useEffect(() => {
        if (!primaryColor) return;
        applyThemeColor(primaryColor);
        return () => {
            applyThemeColor('blue');
        };
    }, [primaryColor]);

    if (trainingLoading || userLoading || accessLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!training) {
        return <NotFound title={t('trainingNotFound')} />;
    }

    if (!canAccessSubpage) {
        return <NotFound title={t('accessDenied')} />;
    }

    const trainingStatusOpt = ElementStatusEnum.getOptions(t).find((o) => o.value === training.status);
    const trainingStatusColor =
        training.status === ElementStatusEnum.ACTIVE
            ? 'green'
            : training.status === ElementStatusEnum.REJECTED
              ? 'red'
              : 'gray';

    const canSubmitEdit =
        editFormData.title.trim().length > 0 &&
        editFormData.link.trim().length > 0 &&
        editFormData.location.trim().length > 0 &&
        editFormData.startedAt.length > 0 &&
        editFormData.endedAt.length > 0 &&
        editFormData.description.trim().length > 0 &&
        editDisciplines.length > 0 &&
        editDisciplines.every(
            (d) =>
                d.discipline !== null &&
                d.distances.length > 0 &&
                d.distances.every((dist) => dist.distance.trim().length > 0 && dist.time.trim().length > 0),
        );

    return (
        <MantineThemeProvider theme={{ primaryColor, colors: { brown } }} inherit>
            <Stack gap="lg">
                {ownerUser && <UserProfileNav user={ownerUser} isOwner={isOwner} />}

                <Card withBorder radius="md" p="lg" shadow="xs">
                    <Group justify="space-between" align="flex-start" mb="md" wrap="nowrap">
                        <div>
                            <Title order={2}>{training.title}</Title>
                            <Group gap="xs" mt={4}>
                                <IconMapPin size={16} />
                                <Text size="sm" c="dimmed">
                                    {training.location || '-'}
                                </Text>
                            </Group>
                        </div>

                        <Group gap="xs" wrap="nowrap">
                            {canManage && (
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
                                                disabled={
                                                    training.status === opt.value || updateStatusMutation.isPending
                                                }
                                                onClick={() => updateStatusMutation.mutate(opt.value)}
                                            >
                                                {opt.label}
                                            </Menu.Item>
                                        ))}
                                    </Menu.Dropdown>
                                </Menu>
                            )}

                            {isOwner && (
                                <>
                                    <Tooltip label={t('editTraining')} withArrow>
                                        <ActionIcon
                                            variant="light"
                                            size={32}
                                            onClick={handleOpenEdit}
                                            aria-label={t('editTraining')}
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
                        <Badge size="lg" color={trainingStatusColor} variant="filled">
                            {trainingStatusOpt?.label ?? training.status}
                        </Badge>
                    </Group>

                    <Group gap="xs" mb="md">
                        <IconClock size={16} />
                        <Text size="xs" c="dimmed">
                            {training.startedAt ? new Date(training.startedAt).toLocaleString() : ''} -{' '}
                            {training.endedAt ? new Date(training.endedAt).toLocaleString() : ''}
                        </Text>
                    </Group>

                    {training.description && (
                        <Text size="sm" mb="md" className="pre-wrap">
                            {training.description}
                        </Text>
                    )}

                    {/* Participants Table */}
                    <Title order={4} mb="xs">
                        {t('participants')}
                    </Title>
                    <Table striped withTableBorder withColumnBorders mb="lg">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>{t('user')}</Table.Th>
                                <Table.Th>{t('status')}</Table.Th>
                                <Table.Th ta="right">{t('actions')}</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {training.participants?.map((p: TrainingParticipantResource) => {
                                const u = participantUsers[p.userId];
                                const isSelf = p.userId === currentUser?.id;
                                const canManageParticipant = isSelf || canManage;
                                const pOpt = SaveStatusEnum.getOptions(t).find((o) => o.value === p.status);
                                const pColor =
                                    p.status === SaveStatusEnum.ACCEPTED
                                        ? 'green'
                                        : p.status === SaveStatusEnum.REJECTED
                                          ? 'red'
                                          : 'yellow';

                                return (
                                    <Table.Tr key={p.id}>
                                        <Table.Td>
                                            <Group gap="sm">
                                                <Avatar src={formatImageSrc(u?.profilePhoto)} radius={5}>
                                                    ?
                                                </Avatar>
                                                <div>
                                                    <Text size="sm" fw={600}>
                                                        {u ? `${u.firstName} ${u.lastName}` : p.userId}
                                                    </Text>
                                                    {u?.link && (
                                                        <Text size="xs" c="dimmed">
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
                                                            size={28}
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
                                                                    size={28}
                                                                    aria-label={t('changeStatus')}
                                                                >
                                                                    <IconAdjustments size={14} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        </Menu.Target>
                                                        <Menu.Dropdown>
                                                            {SaveStatusEnum.getOptions(t).map((opt) => (
                                                                <Menu.Item
                                                                    key={opt.value}
                                                                    disabled={
                                                                        p.status === opt.value ||
                                                                        updateParticipantStatusMutation.isPending
                                                                    }
                                                                    onClick={() =>
                                                                        updateParticipantStatusMutation.mutate({
                                                                            participantId: p.id,
                                                                            status: opt.value as SaveStatusEnum,
                                                                        })
                                                                    }
                                                                >
                                                                    {opt.label}
                                                                </Menu.Item>
                                                            ))}
                                                        </Menu.Dropdown>
                                                    </Menu>
                                                )}
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>

                    {/* Multi-level Disciplines Table Hierarchy */}
                    <Title order={4} mb="xs">
                        {t('disciplinesAndDistances')}
                    </Title>
                    <Stack gap="md">
                        {training.disciplines?.map((disc: TrainingDisciplineResource) => (
                            <Paper key={disc.id} withBorder p="md" radius="md">
                                <Badge size="md" mb="sm">
                                    {DisciplineEnum.getOptions(t).find((o) => o.value === disc.discipline)?.label ??
                                        disc.discipline}
                                </Badge>

                                <Stack gap="sm">
                                    {disc.distances?.map((dist: TrainingDisciplineDistanceResource) => (
                                        <Paper key={dist.id} p="sm" radius="sm" withBorder>
                                            <Group justify="space-between" mb="xs">
                                                <Group gap="xs">
                                                    <Badge color="teal" variant="light">
                                                        {dist.distance} m
                                                    </Badge>
                                                    <Badge color="orange" variant="light">
                                                        {dist.time} s
                                                    </Badge>
                                                </Group>
                                                <Text size="xs" c="dimmed">
                                                    {dist.createdAt
                                                        ? new Date(dist.createdAt).toLocaleDateString()
                                                        : ''}
                                                </Text>
                                            </Group>

                                            {/* Subdistances table */}
                                            {dist.subDistances && dist.subDistances.length > 0 && (
                                                <Table striped withTableBorder>
                                                    <Table.Thead>
                                                        <Table.Tr>
                                                            <Table.Th>{t('subDistanceMeters')}</Table.Th>
                                                            <Table.Th>{t('timeSeconds')}</Table.Th>
                                                            <Table.Th>{t('lat')}</Table.Th>
                                                            <Table.Th>{t('lng')}</Table.Th>
                                                            <Table.Th>{t('accuracy')}</Table.Th>
                                                            <Table.Th>{t('speed')}</Table.Th>
                                                        </Table.Tr>
                                                    </Table.Thead>
                                                    <Table.Tbody>
                                                        {dist.subDistances.map(
                                                            (sd: TrainingDisciplineSubDistanceResource) => (
                                                                <Table.Tr key={sd.id}>
                                                                    <Table.Td>{sd.subDistance} m</Table.Td>
                                                                    <Table.Td>{sd.time} s</Table.Td>
                                                                    <Table.Td>{sd.lat ?? '-'}</Table.Td>
                                                                    <Table.Td>{sd.lng ?? '-'}</Table.Td>
                                                                    <Table.Td>{sd.accuracy ?? '-'}</Table.Td>
                                                                    <Table.Td>{sd.speed ?? '-'}</Table.Td>
                                                                </Table.Tr>
                                                            ),
                                                        )}
                                                    </Table.Tbody>
                                                </Table>
                                            )}
                                        </Paper>
                                    ))}
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>
                </Card>

                {/* Edit modal */}
                <Modal opened={editOpened} onClose={closeEdit} title={t('editTraining')} size="lg">
                    <Stack gap="sm">
                        <TextInput
                            label={t('title')}
                            required
                            value={editFormData.title}
                            error={editFieldErrors.title}
                            onChange={(e) => {
                                const title = e.currentTarget.value;
                                const linkVal = title
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, '-')
                                    .replace(/(^-|-$)/g, '');
                                setEditFormData({ ...editFormData, title, link: linkVal });
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

                        <MultiSelect
                            label={t('collaborators')}
                            placeholder={t('selectCollaborators')}
                            data={collaboratorOptions}
                            value={editCollaboratorIds}
                            onChange={setEditCollaboratorIds}
                            searchable
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
                                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                                                    <TextInput
                                                        label={t('distanceMeters')}
                                                        required
                                                        value={dist.distance}
                                                        onChange={(e) =>
                                                            handleEditDistanceChange(
                                                                d.id,
                                                                dist.id,
                                                                'distance',
                                                                e.currentTarget.value,
                                                            )
                                                        }
                                                    />
                                                    <TextInput
                                                        label={t('timeSeconds')}
                                                        required
                                                        value={dist.time}
                                                        onChange={(e) =>
                                                            handleEditDistanceChange(
                                                                d.id,
                                                                dist.id,
                                                                'time',
                                                                e.currentTarget.value,
                                                            )
                                                        }
                                                    />
                                                </SimpleGrid>

                                                <Group justify="flex-end" mt="xs">
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

                                                <Stack gap="xs" mt="xs" pl="sm">
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
                                                        <Paper key={sd.id} p="xs" radius="xs" withBorder>
                                                            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xs">
                                                                <TextInput
                                                                    size="xs"
                                                                    label={t('subDistanceMeters')}
                                                                    required
                                                                    value={sd.subDistance}
                                                                    onChange={(e) =>
                                                                        handleEditSubDistanceChange(
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
                                                                        handleEditSubDistanceChange(
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
                                                                        handleEditSubDistanceChange(
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
                                                                        handleEditSubDistanceChange(
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
                                                                        handleEditSubDistanceChange(
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
                                                                        handleEditSubDistanceChange(
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
                                                                <ActionIcon
                                                                    color="red"
                                                                    variant="subtle"
                                                                    size="xs"
                                                                    onClick={() =>
                                                                        handleRemoveEditSubDistance(
                                                                            d.id,
                                                                            dist.id,
                                                                            sd.id,
                                                                        )
                                                                    }
                                                                    title={t('delete')}
                                                                >
                                                                    <IconTrash size={14} />
                                                                </ActionIcon>
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

                        <Button
                            mt="md"
                            loading={updateTrainingMutation.isPending}
                            disabled={updateTrainingMutation.isPending || !canSubmitEdit}
                            onClick={() => updateTrainingMutation.mutate()}
                        >
                            {t('saveChanges')}
                        </Button>
                    </Stack>
                </Modal>
            </Stack>
        </MantineThemeProvider>
    );
}
