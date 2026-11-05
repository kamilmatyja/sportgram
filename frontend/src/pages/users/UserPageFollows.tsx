import { useState, useMemo } from 'react';
import NotFound from '../../components/NotFound';
import {
    Text,
    Center,
    Loader,
    Stack,
    ActionIcon,
    Tooltip,
    SimpleGrid,
    Select,
    Badge,
    Group,
    Menu,
    Avatar,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconAdjustments, IconEye } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import {
    userService,
    pageService,
    type PageFollowResource,
    type PageResource,
    type GetPageFollowsQuery,
} from '../../api/services';
import { useUserSubpageAccess } from '../../hooks/useUserSubpageAccess';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { PageFollowStatusEnum } from '../../enums/PageFollowStatusEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatDateTime } from '../../utils/date';
import { formatImageSrc } from '../../utils/imageUtils';

export default function UserPageFollows() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>('createdAt:desc');

    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const { data: targetUser, isLoading: userLoading } = useQuery({
        queryKey: ['user', link],
        queryFn: () => userService.getUserByLink(link || ''),
        enabled: !!link,
    });

    const {
        isOwner,
        canAccessSubpage,
        isLoading: accessLoading,
    } = useUserSubpageAccess({
        targetUser,
    });

    const sortOptions: SortOption[] = [
        { value: 'createdAt:desc', label: t('sort_createdAt_desc') },
        { value: 'createdAt:asc', label: t('sort_createdAt_asc') },
        { value: 'status:asc', label: t('sort_status_asc') },
        { value: 'status:desc', label: t('sort_status_desc') },
    ];

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (statusFilter !== null) count++;
        return count;
    }, [statusFilter]);

    const handleResetFilters = () => {
        setStatusFilter(null);
        setPage(1);
    };

    const queryFilter = useMemo(() => {
        return {
            userId: targetUser?.id ?? '',
            pageIds: null,
            status: statusFilter ? (Number(statusFilter) as 1 | 2 | 3 | 4) : null,
        };
    }, [targetUser?.id, statusFilter]);

    const { data, isLoading } = useQuery({
        queryKey: ['user-page-follows', targetUser?.id, page, limit, sort, queryFilter],
        queryFn: () => {
            if (!targetUser?.id) return null;
            return pageService.listPageFollows({
                page,
                limit,
                filter: queryFilter,
                sort: (sort as NonNullable<GetPageFollowsQuery>['sort']) ?? 'createdAt:desc',
            });
        },
        enabled: !!targetUser?.id && canAccessSubpage,
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
            const pages = await pageService.getPagesByIds(pageIds);
            const map: Record<string, PageResource> = {};
            pages.forEach((p) => {
                map[p.id] = p;
            });
            return map;
        },
        enabled: pageIds.length > 0,
    });

    const pagesMap = pagesMapData ?? {};

    const statusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: PageFollowStatusEnum }) => {
            await pageService.updatePageFollowStatus(id, status);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-page-follows', targetUser?.id] });
            notifications.show({ title: t('pageFollows'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await pageService.deletePageFollow(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-page-follows', targetUser?.id] });
            notifications.show({ title: t('pageFollows'), message: t('followDeleted'), color: 'green' });
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
            render: (f) => {
                let color = 'gray';
                let label = '';
                switch (f.status) {
                    case PageFollowStatusEnum.PENDING:
                        color = 'gray';
                        label = t('pageFollowStatuses.pending');
                        break;
                    case PageFollowStatusEnum.ACCEPTED:
                        color = 'green';
                        label = t('pageFollowStatuses.accepted');
                        break;
                    case PageFollowStatusEnum.REJECTED:
                        color = 'red';
                        label = t('pageFollowStatuses.rejected');
                        break;
                    case PageFollowStatusEnum.UNFOLLOWED:
                        color = 'gray';
                        label = t('pageFollowStatuses.unfollowed');
                        break;
                }
                return (
                    <Badge color={color} variant="light">
                        {label || f.status}
                    </Badge>
                );
            },
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
                data={PageFollowStatusEnum.getOptions(t).map((s) => ({ value: String(s.value), label: s.label }))}
                value={statusFilter}
                onChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                }}
                clearable
            />
        </SimpleGrid>
    );

    if (userLoading || accessLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!targetUser) {
        return <NotFound title={t('userNotFound')} />;
    }

    if (!canAccessSubpage) {
        return <NotFound title={t('accessDenied')} />;
    }

    return (
        <Stack gap="md">
            <UserProfileNav user={targetUser} isOwner={isOwner} />
            <DataTable
                columns={columns}
                data={follows}
                isLoading={isLoading}
                page={page}
                totalItems={pagination?.total}
                onPageChange={setPage}
                limit={limit}
                onLimitChange={(l) => {
                    setLimit(l);
                    setPage(1);
                }}
                sort={sort}
                onSortChange={(s) => {
                    setSort(s);
                    setPage(1);
                }}
                sortOptions={sortOptions}
                filtersNode={filtersNode}
                hasActiveFilters={activeFiltersCount > 0}
                activeFiltersCount={activeFiltersCount}
                onResetFilters={handleResetFilters}
                actions={(f) => {
                    const pageItem = pagesMap[f.pageId];
                    return (
                        <Group gap="xs" justify="flex-end" wrap="nowrap">
                            {pageItem?.link && (
                                <Tooltip label={t('details')} withArrow>
                                    <ActionIcon
                                        component={Link}
                                        to={`/pages/${pageItem.link}`}
                                        variant="light"
                                        size={30}
                                        aria-label={t('details')}
                                    >
                                        <IconEye size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            )}
                            {isOwner && (
                                <Menu shadow="md" width={160} position="bottom-end">
                                    <Menu.Target>
                                        <Tooltip label={t('changeStatus')} withArrow>
                                            <ActionIcon
                                                variant="light"
                                                size={30}
                                                aria-label={t('changeStatus')}
                                                loading={statusMutation.isPending}
                                            >
                                                <IconAdjustments size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        {PageFollowStatusEnum.getOptions(t).map((opt) => (
                                            <Menu.Item
                                                key={opt.value}
                                                disabled={f.status === opt.value || statusMutation.isPending}
                                                onClick={() =>
                                                    statusMutation.mutate({
                                                        id: f.id,
                                                        status: opt.value as PageFollowStatusEnum,
                                                    })
                                                }
                                            >
                                                {opt.label}
                                            </Menu.Item>
                                        ))}
                                    </Menu.Dropdown>
                                </Menu>
                            )}
                            {isOwner && (
                                <Tooltip label={t('unfollow')} withArrow>
                                    <ActionIcon
                                        variant="light"
                                        color="red"
                                        size={30}
                                        onClick={() => handleDelete(f.id)}
                                        aria-label={t('unfollow')}
                                    >
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            )}
                        </Group>
                    );
                }}
            />
        </Stack>
    );
}
