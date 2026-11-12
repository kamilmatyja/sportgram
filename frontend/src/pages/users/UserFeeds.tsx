import { useState } from 'react';
import { Text, Avatar, Badge, Group } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { feedService, type FeedResource, type GetFeedsQuery } from '../../api/services';
import { DataTable, type Column } from '../../components';
import {
    StatusBadge,
    StatusActionMenu,
    ViewActionButton,
    EditActionButton,
    DeleteActionButton,
    UserSubpageContainer,
    TextStatusFilter,
} from '../../components';
import { FeedModal } from '../../components';
import type { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { useDataTableState } from '../../hooks';
import {
    notifySuccess,
    notifyError,
    confirmDelete,
    formatImageSrc,
    formatDateTime,
    buildSortOptions,
    truncate,
    formatFeedOrigin,
} from '../../utils';

export default function UserFeeds() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const tableState = useDataTableState();

    const [textFilter, setTextFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [createOpened, setCreateOpened] = useState(false);
    const [editingFeed, setEditingFeed] = useState<FeedResource | null>(null);

    const sortOptions = buildSortOptions(t, ['createdAt', 'text', 'status']);
    const activeFiltersCount = [textFilter.trim(), statusFilter].filter(Boolean).length;

    const handleResetFilters = () => {
        setTextFilter('');
        setStatusFilter(null);
        tableState.resetPage();
    };

    return (
        <UserSubpageContainer>
            {({ targetUser, isOwner, isAdmin, canAccessSubpage }) => {
                const queryFilter = {
                    userId: targetUser?.id ?? null,
                    text: textFilter.trim() || null,
                    status: statusFilter ? Number(statusFilter) : null,
                };

                const { data, isLoading } = useQuery({
                    queryKey: [
                        'user-feeds',
                        targetUser?.id,
                        tableState.page,
                        tableState.limit,
                        tableState.sort,
                        queryFilter,
                    ],
                    queryFn: () => {
                        if (!targetUser?.id) return null;
                        return feedService.getFeeds({
                            params: {
                                query: {
                                    page: tableState.page,
                                    limit: tableState.limit,
                                    filter: queryFilter as NonNullable<GetFeedsQuery>['filter'],
                                    sort: (tableState.sort as NonNullable<GetFeedsQuery>['sort']) ?? 'createdAt:desc',
                                    'include[]': ['feedOrigin'],
                                },
                            },
                        });
                    },
                    enabled: !!targetUser?.id && canAccessSubpage,
                });

                const feeds = data?.data ?? [];
                const pagination = data?.pagination;

                const statusMutation = useMutation({
                    mutationFn: ({ id, status }: { id: string; status: ElementStatusEnum }) =>
                        feedService.updateFeedStatus({
                            params: { path: { id } },
                            body: { status },
                        }),
                    onSuccess: () => {
                        void queryClient.invalidateQueries({ queryKey: ['user-feeds', targetUser?.id] });
                        void queryClient.invalidateQueries({ queryKey: ['user-profile-feeds', targetUser?.id] });
                        void queryClient.invalidateQueries({ queryKey: ['feeds'] });
                        notifySuccess(t('statusUpdated'), t('feeds'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

                const deleteMutation = useMutation({
                    mutationFn: (id: string) => feedService.deleteFeed({ params: { path: { id } } }),
                    onSuccess: () => {
                        void queryClient.invalidateQueries({ queryKey: ['user-feeds', targetUser?.id] });
                        void queryClient.invalidateQueries({ queryKey: ['user-profile-feeds', targetUser?.id] });
                        void queryClient.invalidateQueries({ queryKey: ['feeds'] });
                        notifySuccess(t('deleted'), t('feeds'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

                const columns: Column<FeedResource>[] = [
                    {
                        key: 'photo',
                        header: t('photo'),
                        render: (f) => <Avatar src={formatImageSrc(f.photo)}>?</Avatar>,
                    },
                    {
                        key: 'text',
                        header: t('text'),
                        render: (f) =>
                            f.text?.trim() ? (
                                <Text size="sm" lineClamp={1} maw={250} title={f.text}>
                                    {truncate(f.text, 40)}
                                </Text>
                            ) : (
                                <Text size="sm" c="dimmed">
                                    -
                                </Text>
                            ),
                    },
                    {
                        key: 'origin',
                        header: t('origin'),
                        render: (f) =>
                            f.feedOrigin ? (
                                <Badge>{formatFeedOrigin(f.feedOrigin, t)}</Badge>
                            ) : (
                                <Text size="sm" c="dimmed">
                                    -
                                </Text>
                            ),
                    },
                    {
                        key: 'status',
                        header: t('status'),
                        render: (f) => <StatusBadge status={f.status} />,
                    },
                    {
                        key: 'createdAt',
                        header: t('createdAt'),
                        render: (f) => (
                            <Text size="sm" c="dimmed">
                                {formatDateTime(f.createdAt)}
                            </Text>
                        ),
                    },
                ];

                const filtersNode = (
                    <TextStatusFilter
                        text={textFilter}
                        onTextChange={setTextFilter}
                        status={statusFilter}
                        onStatusChange={setStatusFilter}
                        onFilterChange={tableState.resetPage}
                    />
                );

                return (
                    <>
                        <DataTable
                            columns={columns}
                            data={feeds}
                            isLoading={isLoading}
                            state={tableState}
                            totalItems={pagination?.total}
                            sortOptions={sortOptions}
                            filtersNode={filtersNode}
                            activeFiltersCount={activeFiltersCount}
                            onResetFilters={handleResetFilters}
                            onAdd={isOwner ? () => setCreateOpened(true) : undefined}
                            addLabel={t('addFeed')}
                            actions={(f) => (
                                <Group gap="xs" justify="flex-end" wrap="nowrap">
                                    {targetUser?.link && <ViewActionButton to={`/users/${targetUser.link}`} />}
                                    {(isOwner || isAdmin) && (
                                        <StatusActionMenu
                                            value={f.status}
                                            onChange={(st) =>
                                                statusMutation.mutate({
                                                    id: f.id,
                                                    status: st,
                                                })
                                            }
                                            loading={statusMutation.isPending}
                                        />
                                    )}
                                    {isOwner && (
                                        <>
                                            <EditActionButton onClick={() => setEditingFeed(f)} />
                                            <DeleteActionButton
                                                onClick={() => confirmDelete(t, () => deleteMutation.mutate(f.id))}
                                                loading={deleteMutation.isPending}
                                            />
                                        </>
                                    )}
                                </Group>
                            )}
                        />

                        <FeedModal opened={createOpened} onClose={() => setCreateOpened(false)} />

                        <FeedModal opened={!!editingFeed} feed={editingFeed} onClose={() => setEditingFeed(null)} />
                    </>
                );
            }}
        </UserSubpageContainer>
    );
}
