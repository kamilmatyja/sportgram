import { useState, useMemo } from 'react';
import NotFound from '../../components/NotFound';
import {
    Text,
    Button,
    Modal,
    Stack,
    TextInput,
    Badge,
    Select,
    MultiSelect,
    SimpleGrid,
    Center,
    Loader,
    ActionIcon,
    Tooltip,
    Group,
    Menu,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEye, IconTrash, IconEdit, IconAdjustments } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import { userService, goalService, friendService, type GoalResource, type GetGoalsQuery } from '../../api/services';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { useAuth } from '../../auth/AuthContext';
import { useUserSubpageAccess } from '../../hooks/useUserSubpageAccess';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { GoalStatusEnum } from '../../enums/GoalStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';

export default function UserGoals() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>('createdAt:desc');

    // Filters
    const [textFilter, setTextFilter] = useState('');
    const [linkFilter, setLinkFilter] = useState('');
    const [disciplineFilter, setDisciplineFilter] = useState<string | null>(null);
    const [distanceFilter, setDistanceFilter] = useState('');
    const [timeFilter, setTimeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    // Create modal
    const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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

    // Edit modal
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [editingGoal, setEditingGoal] = useState<GoalResource | null>(null);
    const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
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

    // Fetch target user by link
    const { data: targetUser, isLoading: userLoading } = useQuery({
        queryKey: ['user', link],
        queryFn: () => userService.getUserByLink(link || ''),
        enabled: !!link,
    });

    const {
        isOwner,
        isAdmin,
        canAccessSubpage,
        hasRequiredRole,
        isLoading: accessLoading,
    } = useUserSubpageAccess({
        targetUser,
        requiredRole: RoleEnum.PARTICIPANT,
    });

    const { data: myFriendsData } = useQuery({
        queryKey: ['my-accepted-friends', currentUser?.id],
        queryFn: async () => {
            if (!currentUser?.id) return [];
            const res = await friendService.getFriends({
                limit: 100,
                filter: { userIds: [currentUser.id], status: FriendStatusEnum.ACCEPTED },
            });
            const friendsList = res.data ?? [];
            const otherIds = friendsList.map((f) =>
                f.senderUserId === currentUser.id ? f.receiverUserId : f.senderUserId,
            );
            if (otherIds.length === 0) return [];
            return await userService.getUsersByIds(otherIds);
        },
        enabled: !!currentUser?.id,
    });

    const sortOptions: SortOption[] = [
        { value: 'createdAt:desc', label: t('sort_createdAt_desc') },
        { value: 'createdAt:asc', label: t('sort_createdAt_asc') },
        { value: 'text:asc', label: t('sort_text_asc') },
        { value: 'text:desc', label: t('sort_text_desc') },
        { value: 'discipline:asc', label: t('sort_discipline_asc') },
        { value: 'discipline:desc', label: t('sort_discipline_desc') },
        { value: 'distance:asc', label: t('sort_distance_asc') },
        { value: 'distance:desc', label: t('sort_distance_desc') },
        { value: 'time:asc', label: t('sort_time_asc') },
        { value: 'time:desc', label: t('sort_time_desc') },
    ];

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (textFilter.trim()) count++;
        if (linkFilter.trim()) count++;
        if (disciplineFilter !== null) count++;
        if (distanceFilter.trim()) count++;
        if (timeFilter.trim()) count++;
        if (statusFilter !== null) count++;
        return count;
    }, [textFilter, linkFilter, disciplineFilter, distanceFilter, timeFilter, statusFilter]);

    const handleResetFilters = () => {
        setTextFilter('');
        setLinkFilter('');
        setDisciplineFilter(null);
        setDistanceFilter('');
        setTimeFilter('');
        setStatusFilter(null);
        setPage(1);
    };

    const queryFilter = useMemo(() => {
        return {
            userId: targetUser?.id ?? null,
            text: textFilter.trim() || null,
            link: linkFilter.trim() || null,
            discipline: disciplineFilter ? (Number(disciplineFilter) as DisciplineEnum) : null,
            distance: distanceFilter.trim() ? Number(distanceFilter) : null,
            time: timeFilter.trim() ? Number(timeFilter) : null,
            status: statusFilter ? (Number(statusFilter) as GoalStatusEnum) : null,
        };
    }, [targetUser?.id, textFilter, linkFilter, disciplineFilter, distanceFilter, timeFilter, statusFilter]);

    // Fetch goals
    const { data, isLoading } = useQuery({
        queryKey: ['goals', targetUser?.id, page, limit, sort, queryFilter],
        queryFn: () => {
            if (!targetUser?.id) return null;
            return goalService.getGoals({
                page,
                limit,
                filter: queryFilter,
                sort: (sort as NonNullable<GetGoalsQuery>['sort']) ?? 'createdAt:desc',
            });
        },
        enabled: !!targetUser?.id && canAccessSubpage && hasRequiredRole,
    });

    const goals = data?.data ?? [];
    const pagination = data?.pagination;

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!currentUser?.id) return;
            if (!formData.discipline) throw new Error(t('discipline') + ' ' + t('required'));
            await goalService.createGoal({
                text: formData.text,
                link: formData.link,
                discipline: Number(formData.discipline) as DisciplineEnum,
                distance: Number(formData.distance) || 0,
                time: formData.time ? Number(formData.time) : null,
                startedAt: formData.startedAt ? formData.startedAt : null,
                endedAt: formData.endedAt ? formData.endedAt : null,
                userIds: Array.from(new Set([currentUser.id, ...collaboratorIds])),
            });
        },
        onSuccess: () => {
            closeCreate();
            setCollaboratorIds([]);
            setFormData({
                text: '',
                link: '',
                discipline: null,
                distance: '',
                time: '',
                startedAt: '',
                endedAt: '',
            });
            setFieldErrors({});
            queryClient.invalidateQueries({ queryKey: ['goals'] });
            notifications.show({ title: t('goals'), message: t('goalCreated'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!editingGoal || !editFormData.discipline) return;
            await goalService.updateGoal(editingGoal.id, {
                text: editFormData.text,
                link: editFormData.link,
                discipline: Number(editFormData.discipline) as DisciplineEnum,
                distance: Number(editFormData.distance) || 0,
                time: editFormData.time ? Number(editFormData.time) : null,
                startedAt: editFormData.startedAt ? editFormData.startedAt : null,
                endedAt: editFormData.endedAt ? editFormData.endedAt : null,
                userIds: currentUser?.id
                    ? Array.from(new Set([currentUser.id, ...editCollaboratorIds]))
                    : editCollaboratorIds,
            });
        },
        onSuccess: () => {
            closeEdit();
            setEditingGoal(null);
            setEditCollaboratorIds([]);
            setEditFieldErrors({});
            queryClient.invalidateQueries({ queryKey: ['goals'] });
            notifications.show({ title: t('goals'), message: t('goalUpdated'), color: 'green' });
        },
        onError: (err) => {
            const fe = extractFieldErrors(err);
            setEditFieldErrors(fe);
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: GoalStatusEnum }) =>
            goalService.updateGoalStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
            notifications.show({ title: t('goals'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => goalService.deleteGoal(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
            notifications.show({ title: t('goals'), message: t('deleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleOpenEdit = (goal: GoalResource) => {
        setEditingGoal(goal);
        setEditFormData({
            text: goal.text,
            link: goal.link,
            discipline: String(goal.discipline),
            distance: String(goal.distance),
            time: goal.time ? String(goal.time) : '',
            startedAt: goal.startedAt ? goal.startedAt.substring(0, 16) : '',
            endedAt: goal.endedAt ? goal.endedAt.substring(0, 16) : '',
        });
        const otherParticipantIds = (goal.participants ?? [])
            .map((p) => p.userId)
            .filter((uid) => uid !== currentUser?.id);
        setEditCollaboratorIds(otherParticipantIds);
        setEditFieldErrors({});
        openEdit();
    };

    const handleDelete = (id: string) => {
        openConfirmActionModal({
            title: t('confirmDeleteTitle'),
            message: t('confirmDeleteMessage'),
            confirmLabel: t('delete'),
            cancelLabel: t('cancel'),
            onConfirm: () => deleteMutation.mutate(id),
        });
    };

    const columns: Column<GoalResource>[] = [
        {
            key: 'text',
            header: t('title'),
            render: (g) => (
                <div>
                    <Text size="sm" fw={600}>
                        {g.text}
                    </Text>
                    <Text size="xs" c="dimmed">
                        @{g.link}
                    </Text>
                </div>
            ),
        },
        {
            key: 'discipline',
            header: t('discipline'),
            render: (g) => (
                <Badge size="xs" variant="outline">
                    {DisciplineEnum.getOptions(t).find((o) => o.value === g.discipline)?.label ?? g.discipline}
                </Badge>
            ),
        },
        {
            key: 'distance',
            header: t('distance'),
            render: (g) => <Text size="xs">{g.distance} m</Text>,
        },
        {
            key: 'status',
            header: t('status'),
            render: (g) => {
                const opt = GoalStatusEnum.getOptions(t).find((o) => o.value === g.status);
                return (
                    <Badge
                        size="xs"
                        variant="light"
                        color={g.status === GoalStatusEnum.COMPLETED ? 'green' : undefined}
                    >
                        {opt?.label ?? g.status}
                    </Badge>
                );
            },
        },
        {
            key: 'createdAt',
            header: t('createdAt'),
            render: (g) => (
                <Text size="xs" c="dimmed">
                    {g.createdAt ? new Date(g.createdAt).toLocaleDateString() : '-'}
                </Text>
            ),
        },
    ];

    const canSubmit =
        formData.text.trim().length > 0 &&
        formData.link.trim().length > 0 &&
        formData.discipline !== null &&
        formData.distance.trim().length > 0;

    const canSubmitEdit =
        editFormData.text.trim().length > 0 &&
        editFormData.link.trim().length > 0 &&
        editFormData.discipline !== null &&
        editFormData.distance.trim().length > 0;

    const filtersNode = (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
            <TextInput
                label={t('title')}
                value={textFilter}
                onChange={(e) => {
                    setTextFilter(e.currentTarget.value);
                    setPage(1);
                }}
            />
            <TextInput
                label={t('link')}
                value={linkFilter}
                onChange={(e) => {
                    setLinkFilter(e.currentTarget.value);
                    setPage(1);
                }}
            />
            <Select
                label={t('discipline')}
                placeholder={t('discipline')}
                data={DisciplineEnum.getOptions(t).map((d) => ({ value: String(d.value), label: d.label }))}
                value={disciplineFilter}
                onChange={(v) => {
                    setDisciplineFilter(v);
                    setPage(1);
                }}
                clearable
            />
            <TextInput
                label={t('distanceMeters')}
                value={distanceFilter}
                onChange={(e) => {
                    setDistanceFilter(e.currentTarget.value);
                    setPage(1);
                }}
            />
            <TextInput
                label={t('timeSeconds')}
                value={timeFilter}
                onChange={(e) => {
                    setTimeFilter(e.currentTarget.value);
                    setPage(1);
                }}
            />
            <Select
                label={t('status')}
                placeholder={t('allStatuses')}
                data={GoalStatusEnum.getOptions(t).map((s) => ({ value: String(s.value), label: s.label }))}
                value={statusFilter}
                onChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                }}
                clearable
            />
        </SimpleGrid>
    );

    if (userLoading || accessLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!targetUser) {
        return <NotFound title={t('userNotFound')} />;
    }

    if (!canAccessSubpage || !hasRequiredRole) {
        return <NotFound title={t('accessDenied')} />;
    }

    return (
        <Stack gap="md">
            <UserProfileNav user={targetUser} isOwner={isOwner} />
            <DataTable
                columns={columns}
                data={goals}
                isLoading={isLoading}
                page={page}
                totalItems={pagination?.total}
                onPageChange={setPage}
                limit={limit}
                onLimitChange={(l) => {
                    setLimit(l);
                    setPage(1);
                }}
                sort={sort}
                onSortChange={(s) => {
                    setSort(s);
                    setPage(1);
                }}
                sortOptions={sortOptions}
                filtersNode={filtersNode}
                hasActiveFilters={activeFiltersCount > 0}
                activeFiltersCount={activeFiltersCount}
                onResetFilters={handleResetFilters}
                onAdd={isOwner ? openCreate : undefined}
                addLabel={t('addGoal')}
                actions={(g) => (
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                        <Tooltip label={t('details')} withArrow>
                            <ActionIcon component={Link} to={`/goals/${g.link}`} variant="light" size={30}>
                                <IconEye size={16} />
                            </ActionIcon>
                        </Tooltip>
                        {(isOwner || isAdmin) && (
                            <Menu shadow="md" width={140} position="bottom-end">
                                <Menu.Target>
                                    <Tooltip label={t('changeStatus')} withArrow>
                                        <ActionIcon
                                            variant="light"
                                            size={30}
                                            aria-label={t('changeStatus')}
                                            loading={statusMutation.isPending}
                                        >
                                            <IconAdjustments size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    {GoalStatusEnum.getOptions(t).map((opt) => (
                                        <Menu.Item
                                            key={opt.value}
                                            onClick={() =>
                                                statusMutation.mutate({
                                                    id: g.id,
                                                    status: opt.value as GoalStatusEnum,
                                                })
                                            }
                                            disabled={g.status === opt.value}
                                        >
                                            {opt.label}
                                        </Menu.Item>
                                    ))}
                                </Menu.Dropdown>
                            </Menu>
                        )}
                        {isOwner && (
                            <Tooltip label={t('edit')} withArrow>
                                <ActionIcon
                                    variant="light"
                                    size={30}
                                    onClick={() => handleOpenEdit(g)}
                                    aria-label={t('edit')}
                                >
                                    <IconEdit size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                        {isOwner && (
                            <Tooltip label={t('delete')} withArrow>
                                <ActionIcon
                                    variant="light"
                                    color="red"
                                    size={30}
                                    onClick={() => handleDelete(g.id)}
                                    loading={deleteMutation.isPending}
                                    disabled={deleteMutation.isPending}
                                    aria-label={t('delete')}
                                >
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </Group>
                )}
            />

            {/* Create modal */}
            <Modal opened={createOpened} onClose={closeCreate} title={t('addGoal')} size="lg">
                <Stack gap="sm">
                    <TextInput
                        label={t('title')}
                        required
                        value={formData.text}
                        error={fieldErrors.text}
                        onChange={(e) => {
                            const text = e.currentTarget.value;
                            const link = text
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)/g, '');
                            setFormData({ ...formData, text, link });
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
                        data={DisciplineEnum.getOptions(t).map((d) => ({ value: String(d.value), label: d.label }))}
                        value={formData.discipline}
                        error={fieldErrors.discipline}
                        onChange={(val) => setFormData({ ...formData, discipline: val })}
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
                        value={collaboratorIds}
                        onChange={setCollaboratorIds}
                        searchable
                        clearable
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
                    <Button
                        mt="md"
                        loading={createMutation.isPending}
                        disabled={createMutation.isPending || !canSubmit}
                        onClick={() => createMutation.mutate()}
                    >
                        {t('add')}
                    </Button>
                </Stack>
            </Modal>

            {/* Edit modal */}
            <Modal opened={editOpened} onClose={closeEdit} title={t('editGoal')} size="lg">
                <Stack gap="sm">
                    <TextInput
                        label={t('title')}
                        required
                        value={editFormData.text}
                        error={editFieldErrors.text}
                        onChange={(e) => setEditFormData({ ...editFormData, text: e.currentTarget.value })}
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
                        placeholder={t('discipline')}
                        required
                        clearable
                        data={DisciplineEnum.getOptions(t).map((d) => ({ value: String(d.value), label: d.label }))}
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
                            required
                            value={editFormData.distance}
                            error={editFieldErrors.distance}
                            onChange={(e) => setEditFormData({ ...editFormData, distance: e.currentTarget.value })}
                        />
                        <TextInput
                            label={t('timeSeconds')}
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
                        loading={updateMutation.isPending}
                        disabled={updateMutation.isPending || !canSubmitEdit}
                        onClick={() => updateMutation.mutate()}
                    >
                        {t('save')}
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
