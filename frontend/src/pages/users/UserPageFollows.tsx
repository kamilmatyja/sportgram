import { useState, useMemo } from 'react';
import { Text, SimpleGrid, Select, Group, Avatar } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../../api/client';
import { pageService, type PageFollowResource, type PageResource, type GetPageFollowsQuery } from '../../api/services';
import { DataTable, type Column } from '../../components/DataTable';
import { PageFollowStatusEnum } from '../../enums/PageFollowStatusEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatDateTime } from '../../utils/date';
import { formatImageSrc } from '../../utils/imageUtils';
import { UserSubpageContainer } from '../../components/common/UserSubpageContainer';
import { useDataTableState } from '../../hooks/useDataTableState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { ViewActionButton, DeleteActionButton } from '../../components/common/RowActionButtons';

export default function UserPageFollows() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const { page, limit, sort, setPage, onLimitChange, onSortChange, resetPage } = useDataTableState({
        defaultSort: 'createdAt:desc',
    });

    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (statusFilter !== null) count++;
        return count;
    }, [statusFilter]);

    const handleResetFilters = () => {
        setStatusFilter(null);
        resetPage();
    };

    return (
        <UserSubpageContainer>
            {({ targetUser, isOwner }) => {
                const queryFilter = {
                    userId: targetUser.id,
                    pageIds: null,
                    status: statusFilter ? (Number(statusFilter) as 1 | 2 | 3 | 4) : null,
                };

                const { data, isLoading } = useQuery({
                    queryKey: ['user-page-follows', targetUser.id, page, limit, sort, queryFilter],
                    queryFn: () =>
                        pageService.getPageFollows({
                            params: {
                                query: {
                                    page,
                                    limit,
                                    filter: queryFilter,
                                    sort: (sort as NonNullable<GetPageFollowsQuery>['sort']) ?? 'createdAt:desc',
                                },
                            },
                        }),
                });

                const follows = (data?.data ?? []) as unknown as PageFollowResource[];
                const pagination = data?.pagination;

                const pageIds = useMemo(() => {
                    return Array.from(new Set(follows.map((f) => f.pageId).filter(Boolean)));
                }, [follows]);

                const { data: pagesMapData } = useQuery({
                    queryKey: ['follow-pages', pageIds],
                    queryFn: async (): Promise<Record<string, PageResource>> => {
                        if (pageIds.length === 0) return {};
                        const results = await Promise.allSettled(
                            pageIds.map((id) => pageService.getPage({ params: { path: { id } } })),
                        );
                        const map: Record<string, PageResource> = {};
                        results.forEach((r) => {
                            if (r.status === 'fulfilled' && r.value?.data) {
                                map[r.value.data.id] = r.value.data;
                            }
                        });
                        return map;
                    },
                    enabled: pageIds.length > 0,
                });

                const pagesMap = pagesMapData ?? {};

                const statusMutation = useMutation({
                    mutationFn: async ({ id, status }: { id: string; status: PageFollowStatusEnum }) => {
                        await pageService.updatePageFollowStatus({
                            params: { path: { id } },
                            body: { status },
                        });
                    },
                    onSuccess: () => {
                        queryClient.invalidateQueries({
                            queryKey: ['user-page-follows', targetUser.id],
                        });
                        notifications.show({
                            title: t('pageFollows'),
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
                    mutationFn: async (id: string) => {
                        await pageService.deletePageFollow({
                            params: { path: { id } },
                        });
                    },
                    onSuccess: () => {
                        queryClient.invalidateQueries({
                            queryKey: ['user-page-follows', targetUser.id],
                        });
                        notifications.show({
                            title: t('pageFollows'),
                            message: t('followDeleted'),
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

                const handleDelete = (id: string) => {
                    openConfirmActionModal({
                        title: t('confirmDeleteTitle'),
                        message: t('confirmDeleteMessage'),
                        confirmLabel: t('delete'),
                        cancelLabel: t('cancel'),
                        onConfirm: () => deleteMutation.mutate(id),
                    });
                };

                const columns: Column<PageFollowResource>[] = [
                    {
                        key: 'page',
                        header: t('page', 'Strona'),
                        render: (f) => {
                            const pageItem = pagesMap[f.pageId];
                            return (
                                <Group gap="sm" wrap="nowrap">
                                    <Avatar src={formatImageSrc(pageItem?.profilePhoto)} radius={5}>
                                        ?
                                    </Avatar>
                                    <div>
                                        <Text size="sm" fw={600}>
                                            {pageItem?.title ?? f.pageId}
                                        </Text>
                                        {pageItem?.link && (
                                            <Text size="sm" c="dimmed">
                                                @{pageItem.link}
                                            </Text>
                                        )}
                                    </div>
                                </Group>
                            );
                        },
                    },
                    {
                        key: 'status',
                        header: t('status'),
                        render: (f) => <StatusBadge status={f.status} enumType={PageFollowStatusEnum} />,
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
                        <Select
                            label={t('status')}
                            placeholder={t('allStatuses')}
                            data={PageFollowStatusEnum.getOptions(t).map((s) => ({
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
                    <DataTable
                        columns={columns}
                        data={follows}
                        isLoading={isLoading}
                        page={page}
                        totalItems={pagination?.total}
                        onPageChange={setPage}
                        limit={limit}
                        onLimitChange={onLimitChange}
                        sort={sort}
                        onSortChange={onSortChange}
                        filtersNode={filtersNode}
                        hasActiveFilters={activeFiltersCount > 0}
                        activeFiltersCount={activeFiltersCount}
                        onResetFilters={handleResetFilters}
                        actions={(f) => {
                            const pageItem = pagesMap[f.pageId];
                            return (
                                <Group gap="xs" justify="flex-end" wrap="nowrap">
                                    {pageItem?.link && <ViewActionButton to={`/pages/${pageItem.link}`} />}
                                    {isOwner && (
                                        <StatusActionMenu
                                            currentStatus={f.status}
                                            options={PageFollowStatusEnum.getOptions(t)}
                                            onStatusChange={(status) =>
                                                statusMutation.mutate({
                                                    id: f.id,
                                                    status: status as PageFollowStatusEnum,
                                                })
                                            }
                                            isPending={statusMutation.isPending}
                                        />
                                    )}
                                    {isOwner && (
                                        <DeleteActionButton
                                            onClick={() => handleDelete(f.id)}
                                            isPending={deleteMutation.isPending}
                                            tooltip={t('unfollow')}
                                        />
                                    )}
                                </Group>
                            );
                        }}
                    />
                );
            }}
        </UserSubpageContainer>
    );
}
