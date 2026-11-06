import { useState, useMemo } from 'react';
import { Text, SimpleGrid, TextInput, Select, Badge, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../../api/client';
import { goalService, type GoalResource, type GetGoalsQuery } from '../../api/services';
import { useMyFriends } from '../../hooks/useMyFriends';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { GoalStatusEnum } from '../../enums/GoalStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatDateTime } from '../../utils/date';
import { truncate } from '../../utils/text';
import { UserSubpageContainer } from '../../components/common/UserSubpageContainer';
import { useDataTableState } from '../../hooks/useDataTableState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { ViewActionButton, EditActionButton, DeleteActionButton } from '../../components/common/RowActionButtons';
import { GoalFormModal } from '../../components/goals/GoalFormModal';

export default function UserGoals() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const { page, limit, sort, setPage, onLimitChange, onSortChange, resetPage } = useDataTableState({
        defaultSort: 'createdAt:desc',
    });

    const [textFilter, setTextFilter] = useState('');
    const [linkFilter, setLinkFilter] = useState('');
    const [disciplineFilter, setDisciplineFilter] = useState<string | null>(null);
    const [distanceFilter, setDistanceFilter] = useState('');
    const [timeFilter, setTimeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [formModalOpened, { open: openFormModal, close: closeFormModal }] = useDisclosure(false);
    const [editingGoal, setEditingGoal] = useState<GoalResource | null>(null);

    const extraUserIds = useMemo(
        () => editingGoal?.participants?.map((p) => p.userId) ?? [],
        [editingGoal?.participants],
    );
    const { collaboratorOptions } = useMyFriends(extraUserIds);

    const sortOptions: SortOption[] = [
        { value: 'createdAt:desc', label: t('sort_createdAt_desc') },
        { value: 'createdAt:asc', label: t('sort_createdAt_asc') },
        { value: 'startedAt:desc', label: t('sort_startedAt_desc') },
        { value: 'startedAt:asc', label: t('sort_startedAt_asc') },
        { value: 'endedAt:desc', label: t('sort_endedAt_desc') },
        { value: 'endedAt:asc', label: t('sort_endedAt_asc') },
        { value: 'text:asc', label: t('sort_text_asc') },
        { value: 'text:desc', label: t('sort_text_desc') },
        { value: 'distance:asc', label: t('sort_distance_asc') },
        { value: 'distance:desc', label: t('sort_distance_desc') },
        { value: 'status:asc', label: t('sort_status_asc') },
        { value: 'status:desc', label: t('sort_status_desc') },
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
        resetPage();
    };

    return (
        <UserSubpageContainer requiredRole={RoleEnum.PARTICIPANT}>
            {({ targetUser, isOwner, isAdmin }) => {
                const queryFilter = {
                    userId: targetUser.id,
                    text: textFilter.trim() || null,
                    link: linkFilter.trim() || null,
                    discipline: disciplineFilter ? (Number(disciplineFilter) as DisciplineEnum) : null,
                    distance: distanceFilter.trim() ? Number(distanceFilter) : null,
                    time: timeFilter.trim() ? Number(timeFilter) : null,
                    status: statusFilter ? (Number(statusFilter) as GoalStatusEnum) : null,
                };

                const { data, isLoading } = useQuery({
                    queryKey: ['user-goals', targetUser.id, page, limit, sort, queryFilter],
                    queryFn: () =>
                        goalService.getGoals({
                            params: {
                                query: {
                                    page,
                                    limit,
                                    filter: queryFilter,
                                    sort: (sort as NonNullable<GetGoalsQuery>['sort']) ?? 'createdAt:desc',
                                    'include[]': ['goalParticipants'],
                                },
                            },
                        }),
                });

                const goals = data?.data ?? [];
                const pagination = data?.pagination;

                const statusMutation = useMutation({
                    mutationFn: ({ id, status }: { id: string; status: GoalStatusEnum }) =>
                        goalService.updateGoalStatus({
                            params: { path: { id } },
                            body: { status },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['user-goals', targetUser.id] });
                        notifications.show({
                            title: t('goals'),
                            message: t('statusUpdated'),
                            color: 'green',
                        });
                    },
                    onError: (err) => {
                        notifications.show({
                            title: t('error'),
                            message: getErrorMessage(err),
                            color: 'red',
                        });
                    },
                });

                const deleteMutation = useMutation({
                    mutationFn: (id: string) =>
                        goalService.deleteGoal({
                            params: { path: { id } },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['user-goals', targetUser.id] });
                        notifications.show({
                            title: t('goals'),
                            message: t('deleted'),
                            color: 'green',
                        });
                    },
                    onError: (err) => {
                        notifications.show({
                            title: t('error'),
                            message: getErrorMessage(err),
                            color: 'red',
                        });
                    },
                });

                const handleOpenEdit = (g: GoalResource) => {
                    setEditingGoal(g);
                    openFormModal();
                };

                const handleOpenCreate = () => {
                    setEditingGoal(null);
                    openFormModal();
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
                                <Text size="sm" fw={600} title={g.text}>
                                    {truncate(g.text, 50)}
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
                            <Badge variant="light">
                                {DisciplineEnum.getOptions(t).find((o) => o.value === g.discipline)?.label ??
                                    g.discipline}
                            </Badge>
                        ),
                    },
                    {
                        key: 'startedAt',
                        header: t('startedAt'),
                        render: (g) => (
                            <Text size="sm" c="dimmed">
                                {formatDateTime(g.startedAt)}
                            </Text>
                        ),
                    },
                    {
                        key: 'endedAt',
                        header: t('endedAt'),
                        render: (g) => (
                            <Text size="sm" c="dimmed">
                                {formatDateTime(g.endedAt)}
                            </Text>
                        ),
                    },
                    {
                        key: 'status',
                        header: t('status'),
                        render: (g) => <StatusBadge status={g.status} enumType={GoalStatusEnum} />,
                    },
                ];

                const filtersNode = (
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
                        <TextInput
                            label={t('title')}
                            value={textFilter}
                            onChange={(e) => {
                                setTextFilter(e.currentTarget.value);
                                resetPage();
                            }}
                        />
                        <TextInput
                            label={t('link')}
                            value={linkFilter}
                            onChange={(e) => {
                                setLinkFilter(e.currentTarget.value);
                                resetPage();
                            }}
                        />
                        <Select
                            label={t('discipline')}
                            placeholder={t('discipline')}
                            data={DisciplineEnum.getOptions(t).map((d) => ({
                                value: String(d.value),
                                label: d.label,
                            }))}
                            value={disciplineFilter}
                            onChange={(v) => {
                                setDisciplineFilter(v);
                                resetPage();
                            }}
                            clearable
                        />
                        <TextInput
                            label={t('distanceMeters')}
                            value={distanceFilter}
                            onChange={(e) => {
                                setDistanceFilter(e.currentTarget.value);
                                resetPage();
                            }}
                        />
                        <TextInput
                            label={t('timeSeconds')}
                            value={timeFilter}
                            onChange={(e) => {
                                setTimeFilter(e.currentTarget.value);
                                resetPage();
                            }}
                        />
                        <Select
                            label={t('status')}
                            placeholder={t('allStatuses')}
                            data={GoalStatusEnum.getOptions(t).map((s) => ({
                                value: String(s.value),
                                label: s.label,
                            }))}
                            value={statusFilter}
                            onChange={(v) => {
                                setStatusFilter(v);
                                resetPage();
                            }}
                            clearable
                        />
                    </SimpleGrid>
                );

                return (
                    <>
                        <DataTable
                            columns={columns}
                            data={goals}
                            isLoading={isLoading}
                            page={page}
                            totalItems={pagination?.total}
                            onPageChange={setPage}
                            limit={limit}
                            onLimitChange={onLimitChange}
                            sort={sort}
                            onSortChange={onSortChange}
                            sortOptions={sortOptions}
                            filtersNode={filtersNode}
                            hasActiveFilters={activeFiltersCount > 0}
                            activeFiltersCount={activeFiltersCount}
                            onResetFilters={handleResetFilters}
                            onAdd={isOwner ? handleOpenCreate : undefined}
                            addLabel={t('addGoal')}
                            actions={(g) => (
                                <Group gap="xs" justify="flex-end" wrap="nowrap">
                                    <ViewActionButton to={`/goals/${g.link}`} />
                                    {(isOwner || isAdmin) && (
                                        <StatusActionMenu
                                            currentStatus={g.status}
                                            options={GoalStatusEnum.getOptions(t)}
                                            onStatusChange={(status) =>
                                                statusMutation.mutate({
                                                    id: g.id,
                                                    status: status as GoalStatusEnum,
                                                })
                                            }
                                            isPending={statusMutation.isPending}
                                        />
                                    )}
                                    {isOwner && <EditActionButton onClick={() => handleOpenEdit(g)} />}
                                    {isOwner && (
                                        <DeleteActionButton
                                            onClick={() => handleDelete(g.id)}
                                            isPending={deleteMutation.isPending}
                                        />
                                    )}
                                </Group>
                            )}
                        />

                        <GoalFormModal
                            opened={formModalOpened}
                            onClose={closeFormModal}
                            goal={editingGoal}
                            collaboratorOptions={collaboratorOptions}
                            onSuccess={() => {
                                queryClient.invalidateQueries({
                                    queryKey: ['user-goals', targetUser.id],
                                });
                            }}
                        />
                    </>
                );
            }}
        </UserSubpageContainer>
    );
}
