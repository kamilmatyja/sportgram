import { useState, useMemo } from 'react';
import { Text, Button, Stack, Modal, SimpleGrid, Select, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../../api/client';
import { feedService, type FeedReactionResource, type GetFeedReactionsQuery } from '../../api/services';
import { DataTable, type Column } from '../../components/DataTable';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { FeedReactionEnum } from '../../enums/FeedReactionEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatDateTime } from '../../utils/date';
import { buildSortOptions } from '../../utils/tableUtils';
import { StatusBadge } from '../../components/StatusBadge';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { ViewActionButton, EditActionButton, DeleteActionButton } from '../../components/common/RowActionButtons';
import { UserSubpageContainer } from '../../components/common/UserSubpageContainer';
import { useDataTableState } from '../../hooks/useDataTableState';
import { useFeedAuthors } from '../../hooks/useFeedAuthors';

export default function UserFeedReactions() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const tableState = useDataTableState();

    const [reactionFilter, setReactionFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [editingReaction, setEditingReaction] = useState<FeedReactionResource | null>(null);
    const [editReactionType, setEditReactionType] = useState<number | null>(null);

    const sortOptions = buildSortOptions(t, ['createdAt', { field: 'reaction', labelKey: 'text' }, 'status']);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (reactionFilter !== null) count++;
        if (statusFilter !== null) count++;
        return count;
    }, [reactionFilter, statusFilter]);

    const handleResetFilters = () => {
        setReactionFilter(null);
        setStatusFilter(null);
        tableState.resetPage();
    };

    return (
        <UserSubpageContainer>
            {({ targetUser, isOwner, isAdmin, canAccessSubpage }) => {
                const queryFilter = {
                    userId: targetUser?.id ?? null,
                    reaction: reactionFilter ? (Number(reactionFilter) as FeedReactionEnum) : null,
                    status: statusFilter ? (Number(statusFilter) as ElementStatusEnum) : null,
                };

                const { data, isLoading } = useQuery({
                    queryKey: [
                        'user-feed-reactions',
                        targetUser?.id,
                        tableState.page,
                        tableState.limit,
                        tableState.sort,
                        queryFilter,
                    ],
                    queryFn: () => {
                        if (!targetUser?.id) return null;
                        return feedService.getFeedReactions({
                            params: {
                                query: {
                                    page: tableState.page,
                                    limit: tableState.limit,
                                    filter: queryFilter,
                                    sort:
                                        (tableState.sort as NonNullable<GetFeedReactionsQuery>['sort']) ??
                                        'createdAt:desc',
                                },
                            },
                        });
                    },
                    enabled: !!targetUser?.id && canAccessSubpage,
                });

                const reactions = data?.data ?? [];
                const pagination = data?.pagination;

                const { getAuthorLink } = useFeedAuthors(reactions.map((r) => r.feedId));

                const statusMutation = useMutation({
                    mutationFn: ({ id, status }: { id: string; status: ElementStatusEnum }) =>
                        feedService.updateFeedReactionStatus({
                            params: { path: { id } },
                            body: { status },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['user-feed-reactions', targetUser?.id] });
                        notifications.show({ title: t('reactions'), message: t('statusUpdated'), color: 'green' });
                    },
                    onError: (err) => {
                        notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
                    },
                });

                const updateMutation = useMutation({
                    mutationFn: async () => {
                        if (!editingReaction || editReactionType === null) return;
                        await feedService.updateFeedReaction({
                            params: { path: { id: editingReaction.id } },
                            body: { type: editReactionType as 1 | 2 | 3 | 4 | 5 | 6 },
                        });
                    },
                    onSuccess: () => {
                        setEditingReaction(null);
                        setEditReactionType(null);
                        queryClient.invalidateQueries({ queryKey: ['user-feed-reactions', targetUser?.id] });
                        notifications.show({ title: t('reactions'), message: t('reactionUpdated'), color: 'green' });
                    },
                    onError: (err) => {
                        notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
                    },
                });

                const deleteMutation = useMutation({
                    mutationFn: (id: string) =>
                        feedService.deleteFeedReaction({
                            params: { path: { id } },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['user-feed-reactions', targetUser?.id] });
                        notifications.show({ title: t('reactions'), message: t('reactionDeleted'), color: 'green' });
                    },
                    onError: (err) => {
                        notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
                    },
                });

                const handleDelete = (id: string) => {
                    openConfirmActionModal({
                        title: t('confirmDeleteTitle'),
                        message: t('confirmDeleteMessage'),
                        confirmLabel: t('delete'),
                        cancelLabel: t('cancel'),
                        onConfirm: () => deleteMutation.mutate(id),
                    });
                };

                const columns: Column<FeedReactionResource>[] = [
                    {
                        key: 'reaction',
                        header: t('reaction'),
                        render: (r) => {
                            const config = FeedReactionEnum.getEmoji(r.reaction);
                            return (
                                <Group gap="xs" wrap="nowrap">
                                    <Text size="md">{config}</Text>
                                    <Text size="sm">{t(`feedReactions.${FeedReactionEnum.getKey(r.reaction)}`)}</Text>
                                </Group>
                            );
                        },
                    },
                    {
                        key: 'status',
                        header: t('status'),
                        render: (r) => <StatusBadge status={r.status} />,
                    },
                    {
                        key: 'createdAt',
                        header: t('createdAt'),
                        render: (r) => (
                            <Text size="sm" c="dimmed">
                                {formatDateTime(r.createdAt)}
                            </Text>
                        ),
                    },
                ];

                const filtersNode = (
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <Select
                            label={t('reaction')}
                            placeholder={t('allReactions')}
                            data={FeedReactionEnum.ALL_REACTIONS.map((item) => ({
                                value: String(item.type),
                                label: `${item.emoji} ${t(`feedReactions.${item.key}`)}`,
                            }))}
                            value={reactionFilter}
                            onChange={(v) => {
                                setReactionFilter(v);
                                tableState.resetPage();
                            }}
                            clearable
                        />
                        <Select
                            label={t('status')}
                            placeholder={t('allStatuses')}
                            data={ElementStatusEnum.getOptions(t).map((s) => ({
                                value: String(s.value),
                                label: s.label,
                            }))}
                            value={statusFilter}
                            onChange={(v) => {
                                setStatusFilter(v);
                                tableState.resetPage();
                            }}
                            clearable
                        />
                    </SimpleGrid>
                );

                return (
                    <>
                        <DataTable
                            columns={columns}
                            data={reactions}
                            isLoading={isLoading}
                            state={tableState}
                            totalItems={pagination?.total}
                            sortOptions={sortOptions}
                            filtersNode={filtersNode}
                            activeFiltersCount={activeFiltersCount}
                            onResetFilters={handleResetFilters}
                            actions={(r) => {
                                const authorLink = getAuthorLink(r.feedId);

                                return (
                                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                                        {authorLink && <ViewActionButton to={`/users/${authorLink}`} />}
                                        {(isOwner || isAdmin) && (
                                            <StatusActionMenu
                                                value={r.status}
                                                onChange={(st) =>
                                                    statusMutation.mutate({
                                                        id: r.id,
                                                        status: st as ElementStatusEnum,
                                                    })
                                                }
                                                loading={statusMutation.isPending}
                                            />
                                        )}
                                        {isOwner && (
                                            <>
                                                <EditActionButton
                                                    onClick={() => {
                                                        setEditingReaction(r);
                                                        setEditReactionType(r.reaction);
                                                    }}
                                                />
                                                <DeleteActionButton
                                                    onClick={() => handleDelete(r.id)}
                                                    loading={deleteMutation.isPending}
                                                />
                                            </>
                                        )}
                                    </Group>
                                );
                            }}
                        />

                        <Modal opened={!!editingReaction} onClose={() => setEditingReaction(null)} title={t('edit')}>
                            <Stack gap="md">
                                <Select
                                    label={t('reaction')}
                                    required
                                    data={FeedReactionEnum.ALL_REACTIONS.map((item) => ({
                                        value: String(item.type),
                                        label: `${item.emoji} ${t(`feedReactions.${item.key}`)}`,
                                    }))}
                                    value={editReactionType ? String(editReactionType) : null}
                                    onChange={(v) => setEditReactionType(v ? Number(v) : null)}
                                />
                                <Group justify="flex-end">
                                    <Button variant="default" onClick={() => setEditingReaction(null)}>
                                        {t('cancel')}
                                    </Button>
                                    <Button onClick={() => updateMutation.mutate()} loading={updateMutation.isPending}>
                                        {t('save')}
                                    </Button>
                                </Group>
                            </Stack>
                        </Modal>
                    </>
                );
            }}
        </UserSubpageContainer>
    );
}
