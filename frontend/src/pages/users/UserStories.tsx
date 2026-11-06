import { useState, useMemo } from 'react';
import { Text, SimpleGrid, TextInput, Select, Avatar, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../../api/client';
import { storyService, type StoryResource, type GetStoriesQuery } from '../../api/services';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatImageSrc } from '../../utils/imageUtils';
import { formatDateTime } from '../../utils/date';
import { truncate } from '../../utils/text';
import { StatusBadge } from '../../components/StatusBadge';
import { StoryViewerModal } from '../../components/StoryViewerModal';
import { StoryModal } from '../../components/story/StoryModal';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { ViewActionButton, EditActionButton, DeleteActionButton } from '../../components/common/RowActionButtons';
import { UserSubpageContainer } from '../../components/common/UserSubpageContainer';
import { useDataTableState } from '../../hooks/useDataTableState';

export default function UserStories() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const { page, setPage, limit, sort, onLimitChange, onSortChange } = useDataTableState({
        initialSort: 'createdAt:desc',
    });

    const [textFilter, setTextFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [createOpened, setCreateOpened] = useState(false);
    const [editingStory, setEditingStory] = useState<StoryResource | null>(null);
    const [viewingStory, setViewingStory] = useState<StoryResource | null>(null);
    const [updatedStoryForModal, setUpdatedStoryForModal] = useState<StoryResource | null>(null);

    const sortOptions: SortOption[] = [
        { value: 'createdAt:desc', label: t('sort_createdAt_desc') },
        { value: 'createdAt:asc', label: t('sort_createdAt_asc') },
        { value: 'text:asc', label: t('sort_text_asc') },
        { value: 'text:desc', label: t('sort_text_desc') },
        { value: 'status:asc', label: t('sort_status_asc') },
        { value: 'status:desc', label: t('sort_status_desc') },
    ];

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (textFilter.trim()) count++;
        if (statusFilter !== null) count++;
        return count;
    }, [textFilter, statusFilter]);

    const handleResetFilters = () => {
        setTextFilter('');
        setStatusFilter(null);
        setPage(1);
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
                    queryKey: ['user-stories', targetUser?.id, page, limit, sort, queryFilter],
                    queryFn: async () => {
                        if (!targetUser?.id) return null;
                        return await storyService.getStories({
                            params: {
                                query: {
                                    page,
                                    limit,
                                    filter: queryFilter,
                                    sort: (sort as NonNullable<GetStoriesQuery>['sort']) ?? 'createdAt:desc',
                                },
                            },
                        });
                    },
                    enabled: !!targetUser?.id && canAccessSubpage,
                });

                const stories = data?.data ?? [];
                const pagination = data?.pagination;

                const statusMutation = useMutation({
                    mutationFn: ({ id, status }: { id: string; status: ElementStatusEnum }) =>
                        storyService.updateStoryStatus({
                            params: { path: { id } },
                            body: { status },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['user-stories', targetUser?.id] });
                        queryClient.invalidateQueries({ queryKey: ['user-profile-stories', targetUser?.id] });
                        queryClient.invalidateQueries({ queryKey: ['stories'] });
                        notifications.show({ title: t('stories'), message: t('statusUpdated'), color: 'green' });
                    },
                    onError: (err) => {
                        notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
                    },
                });

                const deleteMutation = useMutation({
                    mutationFn: (id: string) =>
                        storyService.deleteStory({
                            params: { path: { id } },
                        }),
                    onSuccess: () => {
                        setViewingStory(null);
                        queryClient.invalidateQueries({ queryKey: ['user-stories', targetUser?.id] });
                        queryClient.invalidateQueries({ queryKey: ['user-profile-stories', targetUser?.id] });
                        queryClient.invalidateQueries({ queryKey: ['stories'] });
                        notifications.show({ title: t('stories'), message: t('storyDeleted'), color: 'green' });
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

                const columns: Column<StoryResource>[] = [
                    {
                        key: 'photo',
                        header: t('photo'),
                        render: (s) => (
                            <Avatar src={formatImageSrc(s.photo)} radius={5} size="md">
                                ?
                            </Avatar>
                        ),
                    },
                    {
                        key: 'text',
                        header: t('text'),
                        render: (s) =>
                            s.text?.trim() ? (
                                <Text size="sm" lineClamp={1} maw={250} title={s.text}>
                                    {truncate(s.text, 40)}
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
                        render: (s) => <StatusBadge status={s.status} type="element" />,
                    },
                    {
                        key: 'createdAt',
                        header: t('createdAt'),
                        render: (s) => (
                            <Text size="sm" c="dimmed">
                                {formatDateTime(s.createdAt)}
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
                                setPage(1);
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
                                setPage(1);
                            }}
                            clearable
                        />
                    </SimpleGrid>
                );

                return (
                    <>
                        <DataTable
                            columns={columns}
                            data={stories}
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
                            onAdd={isOwner ? () => setCreateOpened(true) : undefined}
                            addLabel={t('addStory')}
                            actions={(s) => (
                                <Group gap="xs" justify="flex-end" wrap="nowrap">
                                    <ViewActionButton onClick={() => setViewingStory(s)} />
                                    {(isOwner || isAdmin) && (
                                        <StatusActionMenu
                                            value={s.status}
                                            options={ElementStatusEnum.getOptions(t)}
                                            onChange={(st) =>
                                                statusMutation.mutate({
                                                    id: s.id,
                                                    status: st as ElementStatusEnum,
                                                })
                                            }
                                            loading={statusMutation.isPending}
                                        />
                                    )}
                                    {isOwner && (
                                        <>
                                            <EditActionButton onClick={() => setEditingStory(s)} />
                                            <DeleteActionButton
                                                onClick={() => handleDelete(s.id)}
                                                loading={deleteMutation.isPending}
                                            />
                                        </>
                                    )}
                                </Group>
                            )}
                        />

                        <StoryModal opened={createOpened} onClose={() => setCreateOpened(false)} />

                        <StoryModal
                            opened={!!editingStory}
                            story={editingStory}
                            onClose={() => setEditingStory(null)}
                            onSuccess={(updated) => {
                                if (updated) setUpdatedStoryForModal(updated);
                            }}
                        />

                        <StoryViewerModal
                            opened={!!viewingStory}
                            onClose={() => setViewingStory(null)}
                            groups={
                                data?.data && targetUser
                                    ? [{ userId: targetUser.id, author: targetUser, stories: data.data }]
                                    : undefined
                            }
                            initialStoryIndex={
                                data?.data && viewingStory
                                    ? Math.max(
                                          0,
                                          data.data.findIndex((s) => s.id === viewingStory.id),
                                      )
                                    : 0
                            }
                            story={viewingStory}
                            author={targetUser}
                            onEdit={(s) => setEditingStory(s)}
                            onDelete={handleDelete}
                            updatedStory={updatedStoryForModal}
                        />
                    </>
                );
            }}
        </UserSubpageContainer>
    );
}
