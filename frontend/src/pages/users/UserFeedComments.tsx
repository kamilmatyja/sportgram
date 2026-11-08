import { useState, useMemo } from 'react';
import { Text, TextInput, Button, Stack, Modal, SimpleGrid, Select, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../../api/client';
import { feedService, type FeedCommentResource, type GetFeedCommentsQuery } from '../../api/services';
import { DataTable, type Column } from '../../components/DataTable';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatDateTime } from '../../utils/date';
import { truncate } from '../../utils/text';
import { buildSortOptions } from '../../utils/tableUtils';
import { StatusBadge } from '../../components/StatusBadge';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { ViewActionButton, EditActionButton, DeleteActionButton } from '../../components/common/RowActionButtons';
import { UserSubpageContainer } from '../../components/common/UserSubpageContainer';
import { useDataTableState } from '../../hooks/useDataTableState';
import { useFeedAuthors } from '../../hooks/useFeedAuthors';

export default function UserFeedComments() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const tableState = useDataTableState();

    const [textFilter, setTextFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [editingComment, setEditingComment] = useState<FeedCommentResource | null>(null);
    const [editText, setEditText] = useState('');

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
                    text: textFilter.trim() ? textFilter.trim() : null,
                    status: statusFilter ? (Number(statusFilter) as ElementStatusEnum) : null,
                };

                const { data, isLoading } = useQuery({
                    queryKey: [
                        'user-feed-comments',
                        targetUser?.id,
                        tableState.page,
                        tableState.limit,
                        tableState.sort,
                        queryFilter,
                    ],
                    queryFn: () => {
                        if (!targetUser?.id) return null;
                        return feedService.getFeedComments({
                            params: {
                                query: {
                                    page: tableState.page,
                                    limit: tableState.limit,
                                    filter: queryFilter,
                                    sort:
                                        (tableState.sort as NonNullable<GetFeedCommentsQuery>['sort']) ??
                                        'createdAt:desc',
                                },
                            },
                        });
                    },
                    enabled: !!targetUser?.id && canAccessSubpage,
                });

                const comments = data?.data ?? [];
                const pagination = data?.pagination;

                const { getAuthorLink } = useFeedAuthors(comments.map((c) => c.feedId));

                const statusMutation = useMutation({
                    mutationFn: ({ id, status }: { id: string; status: ElementStatusEnum }) =>
                        feedService.updateFeedCommentStatus({
                            params: { path: { id } },
                            body: { status },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['user-feed-comments', targetUser?.id] });
                        notifications.show({ title: t('comments'), message: t('statusUpdated'), color: 'green' });
                    },
                    onError: (err) => {
                        notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
                    },
                });

                const updateMutation = useMutation({
                    mutationFn: async () => {
                        if (!editingComment) return;
                        await feedService.updateFeedComment({
                            params: { path: { id: editingComment.id } },
                            body: { text: editText },
                        });
                    },
                    onSuccess: () => {
                        setEditingComment(null);
                        setEditText('');
                        queryClient.invalidateQueries({ queryKey: ['user-feed-comments', targetUser?.id] });
                        notifications.show({ title: t('comments'), message: t('commentUpdated'), color: 'green' });
                    },
                    onError: (err) => {
                        notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
                    },
                });

                const deleteMutation = useMutation({
                    mutationFn: (id: string) =>
                        feedService.deleteFeedComment({
                            params: { path: { id } },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['user-feed-comments', targetUser?.id] });
                        notifications.show({ title: t('comments'), message: t('commentDeleted'), color: 'green' });
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

                const columns: Column<FeedCommentResource>[] = [
                    {
                        key: 'text',
                        header: t('text'),
                        render: (c) =>
                            c.text?.trim() ? (
                                <Text size="sm" lineClamp={1} maw={250} title={c.text}>
                                    {truncate(c.text, 40)}
                                </Text>
                            ) : (
                                <Text size="sm" c="dimmed">
                                    —
                                </Text>
                            ),
                    },
                    {
                        key: 'status',
                        header: t('status'),
                        render: (c) => <StatusBadge status={c.status} />,
                    },
                    {
                        key: 'createdAt',
                        header: t('createdAt'),
                        render: (c) => (
                            <Text size="sm" c="dimmed">
                                {formatDateTime(c.createdAt)}
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
                            data={comments}
                            isLoading={isLoading}
                            state={tableState}
                            totalItems={pagination?.total}
                            sortOptions={sortOptions}
                            filtersNode={filtersNode}
                            activeFiltersCount={activeFiltersCount}
                            onResetFilters={handleResetFilters}
                            actions={(c) => {
                                const authorLink = getAuthorLink(c.feedId);

                                return (
                                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                                        {authorLink && <ViewActionButton to={`/users/${authorLink}`} />}
                                        {(isOwner || isAdmin) && (
                                            <StatusActionMenu
                                                value={c.status}
                                                onChange={(st) =>
                                                    statusMutation.mutate({
                                                        id: c.id,
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
                                                        setEditingComment(c);
                                                        setEditText(c.text);
                                                    }}
                                                />
                                                <DeleteActionButton
                                                    onClick={() => handleDelete(c.id)}
                                                    loading={deleteMutation.isPending}
                                                />
                                            </>
                                        )}
                                    </Group>
                                );
                            }}
                        />

                        <Modal opened={!!editingComment} onClose={() => setEditingComment(null)} title={t('edit')}>
                            <Stack gap="md">
                                <TextInput
                                    label={t('text')}
                                    required
                                    value={editText}
                                    onChange={(e) => setEditText(e.currentTarget.value)}
                                />
                                <Group justify="flex-end">
                                    <Button variant="default" onClick={() => setEditingComment(null)}>
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
