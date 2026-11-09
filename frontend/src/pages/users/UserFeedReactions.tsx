import { useState } from 'react';
import { Text, Button, Stack, Modal, SimpleGrid, Select, Group } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { feedService, type FeedReactionResource, type GetFeedReactionsQuery } from '../../api/services';
import { DataTable, type Column } from '../../components';
import {
    StatusBadge,
    StatusActionMenu,
    ViewActionButton,
    EditActionButton,
    DeleteActionButton,
    UserSubpageContainer,
} from '../../components';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { FeedReactionEnum } from '../../enums/FeedReactionEnum';
import { useDataTableState, useFeedAuthors, useFormErrors } from '../../hooks';
import { notifySuccess, notifyError, confirmDelete, formatDateTime, buildSortOptions } from '../../utils';

export default function UserFeedReactions() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const tableState = useDataTableState();

    const [reactionFilter, setReactionFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [editingReaction, setEditingReaction] = useState<FeedReactionResource | null>(null);
    const [editReactionType, setEditReactionType] = useState<number | null>(null);
    const { errors, setFromError, clearFieldError, clearErrors } = useFormErrors();

    const sortOptions = buildSortOptions(t, ['createdAt', { field: 'reaction', labelKey: 'text' }, 'status']);
    const activeFiltersCount = [reactionFilter, statusFilter].filter(Boolean).length;

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
                        void queryClient.invalidateQueries({ queryKey: ['user-feed-reactions', targetUser?.id] });
                        notifySuccess(t('statusUpdated'), t('reactions'));
                    },
                    onError: (err) => notifyError(err, t('error')),
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
                        clearErrors();
                        void queryClient.invalidateQueries({ queryKey: ['user-feed-reactions', targetUser?.id] });
                        notifySuccess(t('saved'), t('reactions'));
                    },
                    onError: (err) => setFromError(err),
                });

                const deleteMutation = useMutation({
                    mutationFn: (id: string) => feedService.deleteFeedReaction({ params: { path: { id } } }),
                    onSuccess: () => {
                        void queryClient.invalidateQueries({ queryKey: ['user-feed-reactions', targetUser?.id] });
                        notifySuccess(t('deleted'), t('reactions'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

                const columns: Column<FeedReactionResource>[] = [
                    {
                        key: 'reaction',
                        header: t('reaction'),
                        render: (r) => (
                            <Group gap="xs" wrap="nowrap">
                                <Text size="md">{FeedReactionEnum.getEmoji(r.reaction)}</Text>
                                <Text size="sm">{t(`feedReactions.${FeedReactionEnum.getKey(r.reaction)}`)}</Text>
                            </Group>
                        ),
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
                    <SimpleGrid>
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
                                                        clearErrors();
                                                        setEditingReaction(r);
                                                        setEditReactionType(r.reaction);
                                                    }}
                                                />
                                                <DeleteActionButton
                                                    onClick={() => confirmDelete(t, () => deleteMutation.mutate(r.id))}
                                                    loading={deleteMutation.isPending}
                                                />
                                            </>
                                        )}
                                    </Group>
                                );
                            }}
                        />

                        <Modal
                            opened={!!editingReaction}
                            onClose={() => {
                                setEditingReaction(null);
                                clearErrors();
                            }}
                            title={t('editReaction')}
                        >
                            <Stack>
                                <Select
                                    label={t('reaction')}
                                    required
                                    data={FeedReactionEnum.ALL_REACTIONS.map((item) => ({
                                        value: String(item.type),
                                        label: `${item.emoji} ${t(`feedReactions.${item.key}`)}`,
                                    }))}
                                    value={editReactionType ? String(editReactionType) : null}
                                    onChange={(v) => {
                                        setEditReactionType(v ? Number(v) : null);
                                        clearFieldError('reaction');
                                        clearFieldError('type');
                                    }}
                                    error={errors.reaction || errors.type}
                                />
                                <Button
                                    onClick={() => updateMutation.mutate()}
                                    loading={updateMutation.isPending}
                                    disabled={editReactionType === null || updateMutation.isPending}
                                >
                                    {t('save')}
                                </Button>
                            </Stack>
                        </Modal>
                    </>
                );
            }}
        </UserSubpageContainer>
    );
}
