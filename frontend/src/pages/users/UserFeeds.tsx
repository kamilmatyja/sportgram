import { useState, useMemo } from 'react';
import { Text, Avatar, SimpleGrid, TextInput, Select, Badge, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../../api/client';
import { feedService, type FeedResource, type GetFeedsQuery } from '../../api/services';
import { DataTable, type Column } from '../../components/DataTable';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatImageSrc } from '../../utils/imageUtils';
import { formatDateTime } from '../../utils/date';
import { truncate, formatFeedOrigin } from '../../utils/text';
import { buildSortOptions } from '../../utils/tableUtils';
import { StatusBadge } from '../../components/StatusBadge';
import { FeedModal } from '../../components/feed/FeedModal';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { ViewActionButton, EditActionButton, DeleteActionButton } from '../../components/common/RowActionButtons';
import { UserSubpageContainer } from '../../components/common/UserSubpageContainer';
import { useDataTableState } from '../../hooks/useDataTableState';

export default function UserFeeds() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const tableState = useDataTableState();

    const [textFilter, setTextFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [createOpened, setCreateOpened] = useState(false);
    const [editingFeed, setEditingFeed] = useState<FeedResource | null>(null);

    const sortOptions = buildSortOptions(t, ['createdAt', 'text', 'status']);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (textFilter.trim()) count++;
        if (statusFilter !== null) count++;
        return count;
    }, [textFilter, statusFilter]);

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
                    status: statusFilter ? (Number(statusFilter) as ElementStatusEnum) : null,
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
                                    filter: queryFilter,
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
                        queryClient.invalidateQueries({ queryKey: ['user-feeds', targetUser?.id] });
                        queryClient.invalidateQueries({ queryKey: ['user-profile-feeds', targetUser?.id] });
                        queryClient.invalidateQueries({ queryKey: ['feeds'] });
                        notifications.show({ title: t('feeds'), message: t('statusUpdated'), color: 'green' });
                    },
                    onError: (err) => {
                        notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
                    },
                });

                const deleteMutation = useMutation({
                    mutationFn: (id: string) =>
                        feedService.deleteFeed({
                            params: { path: { id } },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['user-feeds', targetUser?.id] });
                        queryClient.invalidateQueries({ queryKey: ['user-profile-feeds', targetUser?.id] });
                        queryClient.invalidateQueries({ queryKey: ['feeds'] });
                        notifications.show({ title: t('feeds'), message: t('feedDeleted'), color: 'green' });
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

                const columns: Column<FeedResource>[] = [
                    {
                        key: 'photo',
                        header: t('photo'),
                        render: (f) => (
                            <Avatar src={formatImageSrc(f.photo)} size="md">
                                ?
                            </Avatar>
                        ),
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
                                    —
                                </Text>
                            ),
                    },
                    {
                        key: 'origin',
                        header: t('origin'),
                        render: (f) =>
                            f.feedOrigin ? (
                                <Badge size="sm">{formatFeedOrigin(f.feedOrigin, t)}</Badge>
                            ) : (
                                <Text size="sm" c="dimmed">
                                    —
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
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <TextInput
                            label={t('text')}
                            placeholder={t('search')}
                            value={textFilter}
                            onChange={(e) => {
                                setTextFilter(e.currentTarget.value);
                                tableState.resetPage();
                            }}
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
                            data={feeds}
                            isLoading={isLoading}
                            state={tableState}
                            totalItems={pagination?.total}
                            sortOptions={sortOptions}
                            filtersNode={filtersNode}
                            activeFiltersCount={activeFiltersCount}
                            onResetFilters={handleResetFilters}
                            onAdd={isOwner ? () => setCreateOpened(true) : undefined}
                            actions={(f) => (
                                <Group gap="xs" justify="flex-end" wrap="nowrap">
                                    {targetUser?.link && <ViewActionButton to={`/users/${targetUser.link}`} />}
                                    {(isOwner || isAdmin) && (
                                        <StatusActionMenu
                                            value={f.status}
                                            onChange={(st) =>
                                                statusMutation.mutate({
                                                    id: f.id,
                                                    status: st as ElementStatusEnum,
                                                })
                                            }
                                            loading={statusMutation.isPending}
                                        />
                                    )}
                                    {isOwner && (
                                        <>
                                            <EditActionButton onClick={() => setEditingFeed(f)} />
                                            <DeleteActionButton
                                                onClick={() => handleDelete(f.id)}
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
