import { useState, useMemo } from 'react';
import { Text, Select, Group, Avatar } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { pageService, type PageFollowResource, type PageResource, type GetPageFollowsQuery } from '../../api/services';
import { DataTable, type Column } from '../../components';
import {
    StatusBadge,
    StatusActionMenu,
    ViewActionButton,
    DeleteActionButton,
    UserSubpageContainer,
} from '../../components';
import { PageFollowStatusEnum } from '../../enums/PageFollowStatusEnum';
import { useDataTableState } from '../../hooks';
import { notifySuccess, notifyError, confirmDelete, formatImageSrc, formatDateTime } from '../../utils';

export default function UserPageFollows() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const tableState = useDataTableState({ defaultSort: 'createdAt:desc' });
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const activeFiltersCount = statusFilter !== null ? 1 : 0;

    const handleResetFilters = () => {
        setStatusFilter(null);
        tableState.resetPage();
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
                    queryKey: [
                        'user-page-follows',
                        targetUser.id,
                        tableState.page,
                        tableState.limit,
                        tableState.sort,
                        queryFilter,
                    ],
                    queryFn: () =>
                        pageService.getPageFollows({
                            params: {
                                query: {
                                    page: tableState.page,
                                    limit: tableState.limit,
                                    filter: queryFilter,
                                    sort:
                                        (tableState.sort as NonNullable<GetPageFollowsQuery>['sort']) ??
                                        'createdAt:desc',
                                },
                            },
                        }),
                });

                const follows = data?.data ?? [];
                const pagination = data?.pagination;

                const pageIds = useMemo(
                    () => Array.from(new Set(follows.map((f) => f.pageId).filter(Boolean))),
                    [follows],
                );

                const { data: pagesMap = {} } = useQuery({
                    queryKey: ['follow-pages', pageIds],
                    queryFn: async (): Promise<Record<string, PageResource>> => {
                        if (pageIds.length === 0) return {};
                        const results = await Promise.allSettled(
                            pageIds.map((id) => pageService.getPage({ params: { path: { id } } })),
                        );
                        return Object.fromEntries(
                            results.flatMap((r) =>
                                r.status === 'fulfilled' && r.value?.data ? [[r.value.data.id, r.value.data]] : [],
                            ),
                        );
                    },
                    enabled: pageIds.length > 0,
                });

                const statusMutation = useMutation({
                    mutationFn: ({ id, status }: { id: string; status: PageFollowStatusEnum }) =>
                        pageService.updatePageFollowStatus({
                            params: { path: { id } },
                            body: { status },
                        }),
                    onSuccess: () => {
                        void queryClient.invalidateQueries({ queryKey: ['user-page-follows', targetUser.id] });
                        notifySuccess(t('statusUpdated'), t('pageFollows'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

                const deleteMutation = useMutation({
                    mutationFn: (id: string) => pageService.deletePageFollow({ params: { path: { id } } }),
                    onSuccess: () => {
                        void queryClient.invalidateQueries({ queryKey: ['user-page-follows', targetUser.id] });
                        notifySuccess(t('deleted'), t('pageFollows'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

                const columns: Column<PageFollowResource>[] = [
                    {
                        key: 'page',
                        header: t('page', ''),
                        render: (f) => {
                            const pageItem = pagesMap[f.pageId];
                            return (
                                <Group wrap="nowrap">
                                    <Avatar src={formatImageSrc(pageItem?.profilePhoto)}>?</Avatar>
                                    <div>
                                        <Text size="sm" fw={600} lineClamp={1}>
                                            {pageItem?.title ?? f.pageId}
                                        </Text>
                                        {pageItem?.link && (
                                            <Text size="sm" c="dimmed" lineClamp={1}>
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
                    <Group grow align="flex-start" gap="sm">
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
                                tableState.resetPage();
                            }}
                            clearable
                        />
                    </Group>
                );

                return (
                    <DataTable
                        columns={columns}
                        data={follows}
                        isLoading={isLoading}
                        totalItems={pagination?.total}
                        state={tableState}
                        filtersNode={filtersNode}
                        activeFiltersCount={activeFiltersCount}
                        onResetFilters={handleResetFilters}
                        actions={(f) => {
                            const pageItem = pagesMap[f.pageId];
                            return (
                                <Group gap="xs" justify="flex-end" wrap="nowrap">
                                    {pageItem?.link && <ViewActionButton to={`/pages/${pageItem.link}`} />}
                                    {isOwner && (
                                        <StatusActionMenu
                                            value={f.status}
                                            enumType={PageFollowStatusEnum}
                                            onChange={(status) =>
                                                statusMutation.mutate({
                                                    id: f.id,
                                                    status: status,
                                                })
                                            }
                                            loading={statusMutation.isPending}
                                        />
                                    )}
                                    {isOwner && (
                                        <DeleteActionButton
                                            onClick={() => confirmDelete(t, () => deleteMutation.mutate(f.id))}
                                            loading={deleteMutation.isPending}
                                            tooltip={t('unfollowPage')}
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
