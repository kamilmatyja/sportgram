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
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEye } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import { userService, goalService, friendService, type GoalResource, type GetGoalsQuery } from '../../api/services';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { GoalStatusEnum } from '../../enums/GoalStatusEnum';

export default function UserGoals() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser, isParticipant, isAdmin } = useAuth();

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

    const [opened, { open, close }] = useDisclosure(false);
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

    // Fetch target user by link
    const { data: targetUser, isLoading: userLoading } = useQuery({
        queryKey: ['user', link],
        queryFn: () => userService.getUserByLink(link || ''),
        enabled: !!link,
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

    const isOwner = currentUser?.id === targetUser?.id;

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
        { value: 'status:asc', label: t('sort_status_asc') },
        { value: 'status:desc', label: t('sort_status_desc') },
        { value: 'startedAt:asc', label: t('sort_startedAt_asc') },
        { value: 'startedAt:desc', label: t('sort_startedAt_desc') },
        { value: 'endedAt:asc', label: t('sort_endedAt_asc') },
        { value: 'endedAt:desc', label: t('sort_endedAt_desc') },
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
        enabled: !!targetUser?.id,
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
            close();
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
                    <Badge size="xs" variant="light" color={g.status === GoalStatusEnum.COMPLETED ? 'green' : 'blue'}>
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

    const filtersNode = (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
            <TextInput
                label={t('title')}
                placeholder={t('title')}
                value={textFilter}
                onChange={(e) => {
                    setTextFilter(e.currentTarget.value);
                    setPage(1);
                }}
            />
            <TextInput
                label={t('link')}
                placeholder={t('link')}
                value={linkFilter}
                onChange={(e) => {
                    setLinkFilter(e.currentTarget.value);
                    setPage(1);
                }}
            />
            <Select
                label={t('discipline')}
                placeholder={t('allDisciplines')}
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
                placeholder="10000"
                value={distanceFilter}
                onChange={(e) => {
                    setDistanceFilter(e.currentTarget.value);
                    setPage(1);
                }}
            />
            <TextInput
                label={t('timeSeconds')}
                placeholder="3600"
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

    if (userLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!targetUser) {
        return <NotFound title={t('userNotFound')} />;
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
                onAdd={(isOwner && isParticipant) || isAdmin ? open : undefined}
                addLabel={t('addGoal')}
                actions={(g) => (
                    <Tooltip label={t('details')} withArrow>
                        <ActionIcon component={Link} to={`/goals/${g.link}`} variant="light" color="blue" size={30}>
                            <IconEye size={16} />
                        </ActionIcon>
                    </Tooltip>
                )}
            />

            <Modal opened={opened} onClose={close} title={t('addGoal')} size="lg">
                <Stack gap="sm">
                    <TextInput
                        label={t('title')}
                        placeholder={t('title')}
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
                        placeholder={t('link')}
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
                            placeholder="10000"
                            required
                            value={formData.distance}
                            error={fieldErrors.distance}
                            onChange={(e) => setFormData({ ...formData, distance: e.currentTarget.value })}
                        />
                        <TextInput
                            label={t('timeSeconds')}
                            placeholder="3600"
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
                        disabled={!canSubmit}
                        onClick={() => createMutation.mutate()}
                    >
                        {t('add')}
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
