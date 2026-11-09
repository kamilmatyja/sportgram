import { useState } from 'react';
import { Text, TextInput, Button, Stack, Modal, Group } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { feedService, type FeedCommentResource, type GetFeedCommentsQuery } from '../../api/services';
import { DataTable, type Column } from '../../components';
import {
    StatusBadge,
    StatusActionMenu,
    ViewActionButton,
    EditActionButton,
    DeleteActionButton,
    UserSubpageContainer,
    TextStatusFilterGrid,
} from '../../components';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { useDataTableState, useFeedAuthors, useFormErrors } from '../../hooks';
import { notifySuccess, notifyError, confirmDelete, formatDateTime, buildSortOptions, truncate } from '../../utils';

export default function UserFeedComments() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const tableState = useDataTableState();
    const { errors, setFromError, clearErrors, clearFieldError } = useFormErrors();

    const [textFilter, setTextFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [editingComment, setEditingComment] = useState<FeedCommentResource | null>(null);
    const [editText, setEditText] = useState('');

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
                        void queryClient.invalidateQueries({ queryKey: ['user-feed-comments', targetUser?.id] });
                        notifySuccess(t('statusUpdated'), t('comments'));
                    },
                    onError: (err) => notifyError(err, t('error')),
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
                        clearErrors();
                        void queryClient.invalidateQueries({ queryKey: ['user-feed-comments', targetUser?.id] });
                        notifySuccess(t('saved'), t('comments'));
                    },
                    onError: (err) => setFromError(err),
                });

                const deleteMutation = useMutation({
                    mutationFn: (id: string) => feedService.deleteFeedComment({ params: { path: { id } } }),
                    onSuccess: () => {
                        void queryClient.invalidateQueries({ queryKey: ['user-feed-comments', targetUser?.id] });
                        notifySuccess(t('deleted'), t('comments'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

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
                    <TextStatusFilterGrid
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
                                                        clearErrors();
                                                        setEditingComment(c);
                                                        setEditText(c.text);
                                                    }}
                                                />
                                                <DeleteActionButton
                                                    onClick={() => confirmDelete(t, () => deleteMutation.mutate(c.id))}
                                                    loading={deleteMutation.isPending}
                                                />
                                            </>
                                        )}
                                    </Group>
                                );
                            }}
                        />

                        <Modal
                            opened={!!editingComment}
                            onClose={() => {
                                setEditingComment(null);
                                clearErrors();
                            }}
                            title={t('editComment')}
                        >
                            <Stack>
                                <TextInput
                                    label={t('text')}
                                    required
                                    value={editText}
                                    onChange={(e) => {
                                        setEditText(e.currentTarget.value);
                                        clearFieldError('text');
                                    }}
                                    error={errors.text}
                                />
                                <Button
                                    onClick={() => updateMutation.mutate()}
                                    loading={updateMutation.isPending}
                                    disabled={!editText.trim() || updateMutation.isPending}
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
