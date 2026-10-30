import { useState, useMemo, useEffect } from 'react';
import {
    Card,
    Title,
    Text,
    Group,
    Stack,
    Badge,
    Table,
    ActionIcon,
    Tooltip,
    MantineThemeProvider,
    Center,
    Loader,
    Button,
    Menu,
    Modal,
    TextInput,
    Select,
    MultiSelect,
    SimpleGrid,
    Avatar,
    Paper,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconEdit, IconAdjustments, IconEye } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { applyThemeColor } from '../../utils/themeUtils';
import NotFound from '../../components/NotFound';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import {
    goalService,
    userService,
    friendService,
    type UserResource,
    type GoalParticipantResource,
    type GoalParticipantResultResource,
} from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { useUserSubpageAccess } from '../../hooks/useUserSubpageAccess';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { ColorEnum } from '../../enums/ColorEnum';
import { GoalStatusEnum } from '../../enums/GoalStatusEnum';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import UserProfileNav from '../../components/UserProfileNav';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { brown } from '../../theme';
import { formatImageSrc } from '../../utils/imageUtils';

export default function GoalDetails() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    // Edit modal
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [editFormData, setEditFormData] = useState({
        text: '',
        link: '',
        discipline: null as string | null,
        distance: '',
        time: '',
        startedAt: '',
        endedAt: '',
    });
    const [editCollaboratorIds, setEditCollaboratorIds] = useState<string[]>([]);
    const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});

    const { data: goal, isLoading: goalLoading } = useQuery({
        queryKey: ['goal', link],
        queryFn: () => goalService.getGoalByLink(link || ''),
        enabled: !!link,
    });

    const { data: ownerUserData, isLoading: userLoading } = useQuery({
        queryKey: ['user', goal?.userId],
        queryFn: () => (goal?.userId ? userService.getUser(goal.userId) : null),
        enabled: !!goal?.userId,
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

    // Fetch friends for collaborator selection
    const { data: myFriendsData } = useQuery({
        queryKey: ['my-friends-accepted-goal-details', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return [];
            const res = await friendService.getFriends({
                filter: { userIds: [currentUser.id], status: FriendStatusEnum.ACCEPTED },
                limit: 100,
            });
            const partnerIds = (res.data ?? []).map((f) =>
                f.senderUserId === currentUser.id ? f.receiverUserId : f.senderUserId,
            );
            if (partnerIds.length === 0) return [];
            return await userService.getUsersByIds(partnerIds);
        },
        enabled: !!currentUser,
    });

    // Fetch participant user info
    const participantUserIds = useMemo(() => {
        if (!goal?.participants) return [];
        return Array.from(new Set(goal.participants.map((p) => p.userId)));
    }, [goal?.participants]);

    const { data: participantUsersData } = useQuery({
        queryKey: ['goal-participant-users', participantUserIds],
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

    const handleOpenEdit = () => {
        if (!goal) return;
        setEditFormData({
            text: goal.text || '',
            link: goal.link || '',
            discipline: goal.discipline !== undefined ? String(goal.discipline) : null,
            distance: goal.distance !== undefined ? String(goal.distance) : '',
            time: goal.time !== undefined && goal.time !== null ? String(goal.time) : '',
            startedAt: goal.startedAt ? goal.startedAt.slice(0, 16) : '',
            endedAt: goal.endedAt ? goal.endedAt.slice(0, 16) : '',
        });
        setEditCollaboratorIds(goal.participants?.map((p) => p.userId).filter((id) => id !== goal.userId) || []);
        setEditFieldErrors({});
        openEdit();
    };

    const updateGoalMutation = useMutation({
        mutationFn: async () => {
            if (!goal || !editFormData.discipline) return;
            await goalService.updateGoal(goal.id, {
                text: editFormData.text,
                link: editFormData.link,
                discipline: Number(editFormData.discipline) as DisciplineEnum,
                distance: Number(editFormData.distance) || 0,
                time: editFormData.time ? Number(editFormData.time) : null,
                startedAt: editFormData.startedAt || null,
                endedAt: editFormData.endedAt || null,
                userIds: editCollaboratorIds.length > 0 ? editCollaboratorIds : null,
            });
        },
        onSuccess: () => {
            closeEdit();
            setEditFieldErrors({});
            queryClient.invalidateQueries({ queryKey: ['goal', link] });
            notifications.show({ title: t('goals'), message: t('goalUpdated'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setEditFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: (status: GoalStatusEnum) => {
            if (!goal?.id) throw new Error('No goal');
            return goalService.updateGoalStatus(goal.id, status);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goal', link] });
            notifications.show({ title: t('goals'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateParticipantStatusMutation = useMutation({
        mutationFn: ({ participantId, status }: { participantId: string; status: ElementStatusEnum }) =>
            goalService.updateGoalParticipantStatus(participantId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goal', link] });
            notifications.show({ title: t('participants'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateResultStatusMutation = useMutation({
        mutationFn: ({ resultId, status }: { resultId: string; status: ElementStatusEnum }) =>
            goalService.updateGoalParticipantResultStatus(resultId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goal', link] });
            notifications.show({ title: t('goals'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!goal?.id) return;
            await goalService.deleteGoal(goal.id);
        },
        onSuccess: () => {
            notifications.show({ title: t('goals'), message: t('goalDeleted'), color: 'green' });
            navigate(ownerUser?.link ? `/users/${ownerUser.link}/goals` : (-1 as unknown as string));
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

    if (goalLoading || userLoading || accessLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!goal) {
        return <NotFound title={t('goalNotFound')} />;
    }

    if (!canAccessSubpage) {
        return <NotFound title={t('accessDenied')} />;
    }

    const goalStatusOpt = GoalStatusEnum.getOptions(t).find((o) => o.value === goal.status);
    const goalStatusColor =
        goal.status === GoalStatusEnum.ACTIVE
            ? 'green'
            : goal.status === GoalStatusEnum.COMPLETED
              ? 'blue'
              : goal.status === GoalStatusEnum.REJECTED
                ? 'red'
                : 'gray';

    return (
        <MantineThemeProvider theme={{ primaryColor, colors: { brown } }} inherit>
            <Stack gap="lg">
                {ownerUser && <UserProfileNav user={ownerUser} isOwner={isOwner} />}

                <Card withBorder radius="md" p="lg" shadow="xs">
                    <Group justify="space-between" align="flex-start" mb="md" wrap="nowrap">
                        <div>
                            <Title order={2}>{goal.text}</Title>
                            <Text size="sm" c="dimmed">
                                @{goal.link}
                            </Text>
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
                                        {GoalStatusEnum.getOptions(t).map((opt) => (
                                            <Menu.Item
                                                key={opt.value}
                                                disabled={goal.status === opt.value || updateStatusMutation.isPending}
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
                                    <Tooltip label={t('editGoal')} withArrow>
                                        <ActionIcon
                                            variant="light"
                                            size={32}
                                            onClick={handleOpenEdit}
                                            aria-label={t('editGoal')}
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

                    <Group gap="sm" mb="md" wrap="wrap">
                        <Badge size="lg">
                            {DisciplineEnum.getOptions(t).find((o) => o.value === goal.discipline)?.label ??
                                goal.discipline}
                        </Badge>
                        <Badge size="lg" color="teal" variant="light">
                            {goal.distance} m
                        </Badge>
                        {goal.time && (
                            <Badge size="lg" color="orange" variant="light">
                                {goal.time} s
                            </Badge>
                        )}
                        <Badge size="lg" color={goalStatusColor} variant="filled">
                            {goalStatusOpt?.label ?? goal.status}
                        </Badge>
                    </Group>

                    {(goal.startedAt || goal.endedAt) && (
                        <Group gap="xs" mb="lg">
                            <Text size="xs" c="dimmed">
                                {goal.startedAt ? new Date(goal.startedAt).toLocaleString() : ''} -{' '}
                                {goal.endedAt ? new Date(goal.endedAt).toLocaleString() : ''}
                            </Text>
                        </Group>
                    )}

                    <Title order={4} mb="xs">
                        {t('participants')}
                    </Title>
                    <Table striped withTableBorder withColumnBorders>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>{t('user')}</Table.Th>
                                <Table.Th>{t('status')}</Table.Th>
                                <Table.Th ta="right">{t('actions')}</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {goal.participants?.map((p: GoalParticipantResource) => {
                                const u = participantUsers[p.userId];
                                const isSelf = p.userId === currentUser?.id;
                                const canManageParticipant = isSelf || canManage;
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
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>

                    {/* Nested Results Section */}
                    {goal.participants?.some((p) => p.results && p.results.length > 0) && (
                        <Stack gap="sm" mt="lg">
                            <Title order={4}>{t('results')}</Title>
                            {goal.participants.map((p) => {
                                if (!p.results || p.results.length === 0) return null;
                                const u = participantUsers[p.userId];
                                const isSelf = p.userId === currentUser?.id;
                                const canManageResult = isSelf || canManage;

                                return (
                                    <Paper key={p.id} withBorder p="sm" radius="md">
                                        <Text fw={600} size="sm" mb="xs">
                                            {u ? `${u.firstName} ${u.lastName}` : p.userId}
                                        </Text>
                                        <Table striped withTableBorder>
                                            <Table.Thead>
                                                <Table.Tr>
                                                    <Table.Th>{t('distanceMeters')}</Table.Th>
                                                    <Table.Th>{t('timeSeconds')}</Table.Th>
                                                    <Table.Th>{t('createdAt')}</Table.Th>
                                                    <Table.Th>{t('status')}</Table.Th>
                                                    <Table.Th ta="right">{t('actions')}</Table.Th>
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {p.results.map((res: GoalParticipantResultResource) => {
                                                    const rOpt = ElementStatusEnum.getOptions(t).find(
                                                        (o) => o.value === res.status,
                                                    );
                                                    const rColor =
                                                        res.status === ElementStatusEnum.ACTIVE
                                                            ? 'green'
                                                            : res.status === ElementStatusEnum.REJECTED
                                                              ? 'red'
                                                              : 'gray';

                                                    return (
                                                        <Table.Tr key={res.id}>
                                                            <Table.Td>{res.distance} m</Table.Td>
                                                            <Table.Td>{res.time} s</Table.Td>
                                                            <Table.Td>
                                                                <Text size="xs" c="dimmed">
                                                                    {res.createdAt
                                                                        ? new Date(res.createdAt).toLocaleString()
                                                                        : '-'}
                                                                </Text>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Badge size="xs" color={rColor} variant="light">
                                                                    {rOpt?.label ?? res.status}
                                                                </Badge>
                                                            </Table.Td>
                                                            <Table.Td ta="right">
                                                                {canManageResult && (
                                                                    <Menu shadow="md" width={160}>
                                                                        <Menu.Target>
                                                                            <Tooltip
                                                                                label={t('changeStatus')}
                                                                                withArrow
                                                                            >
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
                                                                            {ElementStatusEnum.getOptions(t).map(
                                                                                (opt) => (
                                                                                    <Menu.Item
                                                                                        key={opt.value}
                                                                                        disabled={
                                                                                            res.status === opt.value ||
                                                                                            updateResultStatusMutation.isPending
                                                                                        }
                                                                                        onClick={() =>
                                                                                            updateResultStatusMutation.mutate(
                                                                                                {
                                                                                                    resultId: res.id,
                                                                                                    status: opt.value as ElementStatusEnum,
                                                                                                },
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        {opt.label}
                                                                                    </Menu.Item>
                                                                                ),
                                                                            )}
                                                                        </Menu.Dropdown>
                                                                    </Menu>
                                                                )}
                                                            </Table.Td>
                                                        </Table.Tr>
                                                    );
                                                })}
                                            </Table.Tbody>
                                        </Table>
                                    </Paper>
                                );
                            })}
                        </Stack>
                    )}
                </Card>

                {/* Edit modal */}
                <Modal opened={editOpened} onClose={closeEdit} title={t('editGoal')} size="lg">
                    <Stack gap="sm">
                        <TextInput
                            label={t('title')}
                            required
                            value={editFormData.text}
                            error={editFieldErrors.text}
                            onChange={(e) => {
                                const val = e.currentTarget.value;
                                const linkVal = val
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, '-')
                                    .replace(/(^-|-$)/g, '');
                                setEditFormData({ ...editFormData, text: val, link: linkVal });
                            }}
                        />
                        <TextInput
                            label={t('link')}
                            required
                            value={editFormData.link}
                            error={editFieldErrors.link}
                            onChange={(e) => setEditFormData({ ...editFormData, link: e.currentTarget.value })}
                        />
                        <Select
                            label={t('discipline')}
                            required
                            clearable
                            data={DisciplineEnum.getOptions(t).map((opt) => ({
                                value: String(opt.value),
                                label: opt.label,
                            }))}
                            value={editFormData.discipline}
                            error={editFieldErrors.discipline}
                            onChange={(val) => setEditFormData({ ...editFormData, discipline: val })}
                        />
                        <MultiSelect
                            label={t('collaborators')}
                            placeholder={t('selectCollaborators')}
                            data={
                                myFriendsData?.map((u) => ({
                                    value: u.id,
                                    label: `${u.firstName} ${u.lastName} (@${u.link})`,
                                })) ?? []
                            }
                            value={editCollaboratorIds}
                            onChange={setEditCollaboratorIds}
                            searchable
                            clearable
                        />
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                            <TextInput
                                label={t('distanceMeters')}
                                type="number"
                                required
                                value={editFormData.distance}
                                error={editFieldErrors.distance}
                                onChange={(e) => setEditFormData({ ...editFormData, distance: e.currentTarget.value })}
                            />
                            <TextInput
                                label={t('timeSeconds')}
                                type="number"
                                value={editFormData.time}
                                error={editFieldErrors.time}
                                onChange={(e) => setEditFormData({ ...editFormData, time: e.currentTarget.value })}
                            />
                        </SimpleGrid>
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                            <TextInput
                                label={t('startedAt')}
                                type="datetime-local"
                                value={editFormData.startedAt}
                                error={editFieldErrors.startedAt}
                                onChange={(e) => setEditFormData({ ...editFormData, startedAt: e.currentTarget.value })}
                            />
                            <TextInput
                                label={t('endedAt')}
                                type="datetime-local"
                                value={editFormData.endedAt}
                                error={editFieldErrors.endedAt}
                                onChange={(e) => setEditFormData({ ...editFormData, endedAt: e.currentTarget.value })}
                            />
                        </SimpleGrid>

                        <Button
                            mt="md"
                            loading={updateGoalMutation.isPending}
                            disabled={
                                updateGoalMutation.isPending ||
                                !editFormData.text.trim() ||
                                !editFormData.link.trim() ||
                                !editFormData.discipline ||
                                !editFormData.distance.trim()
                            }
                            onClick={() => updateGoalMutation.mutate()}
                        >
                            {t('saveChanges')}
                        </Button>
                    </Stack>
                </Modal>
            </Stack>
        </MantineThemeProvider>
    );
}
