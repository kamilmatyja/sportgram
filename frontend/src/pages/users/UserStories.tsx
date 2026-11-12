import { useState } from 'react';
import { Text, TextInput, Select, Avatar, Group } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { storyService, type StoryResource, type GetStoriesQuery } from '../../api/services';
import { DataTable, type Column } from '../../components';
import { StoryViewerModal } from '../../components';
import {
    StatusBadge,
    StatusActionMenu,
    ViewActionButton,
    EditActionButton,
    DeleteActionButton,
    UserSubpageContainer,
} from '../../components';
import { StoryModal } from '../../components';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { useDataTableState } from '../../hooks';
import {
    notifySuccess,
    notifyError,
    confirmDelete,
    formatImageSrc,
    formatDateTime,
    buildSortOptions,
    truncate,
} from '../../utils';

export default function UserStories() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const tableState = useDataTableState({ initialSort: 'createdAt:desc' });

    const [textFilter, setTextFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [createOpened, setCreateOpened] = useState(false);
    const [editingStory, setEditingStory] = useState<StoryResource | null>(null);
    const [viewingStory, setViewingStory] = useState<StoryResource | null>(null);
    const [updatedStoryForModal, setUpdatedStoryForModal] = useState<StoryResource | null>(null);

    const sortOptions = buildSortOptions(t, ['createdAt', 'text', 'status']);
    const activeFiltersCount = [textFilter.trim(), statusFilter].filter(Boolean).length;

    const handleResetFilters = () => {
        setTextFilter('');
        setStatusFilter(null);
        tableState.setPage(1);
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
                        'user-stories',
                        targetUser?.id,
                        tableState.page,
                        tableState.limit,
                        tableState.sort,
                        queryFilter,
                    ],
                    queryFn: async () => {
                        if (!targetUser?.id) return null;
                        return await storyService.getStories({
                            params: {
                                query: {
                                    page: tableState.page,
                                    limit: tableState.limit,
                                    filter: queryFilter as NonNullable<GetStoriesQuery>['filter'],
                                    sort: (tableState.sort as NonNullable<GetStoriesQuery>['sort']) ?? 'createdAt:desc',
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
                        void queryClient.invalidateQueries({ queryKey: ['user-stories', targetUser?.id] });
                        void queryClient.invalidateQueries({ queryKey: ['user-profile-stories', targetUser?.id] });
                        void queryClient.invalidateQueries({ queryKey: ['stories'] });
                        notifySuccess(t('statusUpdated'), t('stories'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

                const deleteMutation = useMutation({
                    mutationFn: (id: string) => storyService.deleteStory({ params: { path: { id } } }),
                    onSuccess: () => {
                        setViewingStory(null);
                        void queryClient.invalidateQueries({ queryKey: ['user-stories', targetUser?.id] });
                        void queryClient.invalidateQueries({ queryKey: ['user-profile-stories', targetUser?.id] });
                        void queryClient.invalidateQueries({ queryKey: ['stories'] });
                        notifySuccess(t('deleted'), t('stories'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

                const columns: Column<StoryResource>[] = [
                    {
                        key: 'photo',
                        header: t('photo'),
                        render: (s) => <Avatar src={formatImageSrc(s.photo)}>?</Avatar>,
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
                                    -
                                </Text>
                            ),
                    },
                    {
                        key: 'status',
                        header: t('status'),
                        render: (s) => <StatusBadge status={s.status} />,
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
                    <Group grow align="flex-start" gap="sm">
                        <TextInput
                            label={t('text')}
                            placeholder={t('search')}
                            value={textFilter}
                            onChange={(e) => {
                                setTextFilter(e.currentTarget.value);
                                tableState.setPage(1);
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
                                tableState.setPage(1);
                            }}
                            clearable
                        />
                    </Group>
                );

                return (
                    <>
                        <DataTable
                            columns={columns}
                            data={stories}
                            isLoading={isLoading}
                            totalItems={pagination?.total}
                            state={tableState}
                            sortOptions={sortOptions}
                            filtersNode={filtersNode}
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
                                            onChange={(st) =>
                                                statusMutation.mutate({
                                                    id: s.id,
                                                    status: st,
                                                })
                                            }
                                            loading={statusMutation.isPending}
                                        />
                                    )}
                                    {isOwner && (
                                        <>
                                            <EditActionButton onClick={() => setEditingStory(s)} />
                                            <DeleteActionButton
                                                onClick={() => confirmDelete(t, () => deleteMutation.mutate(s.id))}
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
                            onDelete={(id) => confirmDelete(t, () => deleteMutation.mutate(id))}
                            updatedStory={updatedStoryForModal}
                        />
                    </>
                );
            }}
        </UserSubpageContainer>
    );
}
