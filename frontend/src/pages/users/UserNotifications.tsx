import { useState, useMemo } from 'react';
import NotFound from '../../components/NotFound';
import { Group, Text, Badge, Stack, SimpleGrid, TextInput, Select, Center, Loader, ActionIcon, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconTrash } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import {
    userService,
    notificationService,
    type NotificationResource,
    type GetNotificationsQuery,
} from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { NotificationStatusEnum } from '../../enums/NotificationStatusEnum';

export default function UserNotifications() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>('createdAt:desc');

    // Filters
    const [textFilter, setTextFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const { data: targetUser, isLoading: userLoading } = useQuery({
        queryKey: ['user', link],
        queryFn: () => userService.getUserByLink(link || ''),
        enabled: !!link,
    });

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

    const queryFilter = useMemo(() => {
        return {
            text: textFilter.trim() || null,
            status: statusFilter ? (Number(statusFilter) as NotificationStatusEnum) : null,
        };
    }, [textFilter, statusFilter]);

    const { data, isLoading } = useQuery({
        queryKey: ['notifications', currentUser?.id, page, limit, sort, queryFilter],
        queryFn: () => {
            if (!currentUser?.id) return null;
            return notificationService.getNotifications({
                page,
                limit,
                filter: queryFilter,
                sort: (sort as NonNullable<GetNotificationsQuery>['sort']) ?? 'createdAt:desc',
            });
        },
        enabled: !!currentUser?.id,
    });

    const notifs = data?.data ?? [];
    const pagination = data?.pagination;

    const markAsReadMutation = useMutation({
        mutationFn: (id: string) => notificationService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => notificationService.deleteNotification(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            notifications.show({ title: t('notifications'), message: t('notificationDeleted'), color: 'green' });
        },
    });

    const columns: Column<NotificationResource>[] = [
        {
            key: 'text',
            header: t('text'),
            render: (n) => (
                <div>
                    <Text size="sm" fw={n.status !== NotificationStatusEnum.READ ? 600 : 400}>
                        {n.text}
                    </Text>
                    <Text size="xs" c="dimmed">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                    </Text>
                </div>
            ),
        },
        {
            key: 'status',
            header: t('status'),
            render: (n) => {
                const isRead = n.status === NotificationStatusEnum.READ;
                return (
                    <Badge size="xs" color={isRead ? 'gray' : 'blue'} variant={isRead ? 'subtle' : 'filled'}>
                        {isRead ? t('notificationStatuses.read') : t('notificationStatuses.sent')}
                    </Badge>
                );
            },
        },
    ];

    const filtersNode = (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
                label={t('text')}
                placeholder={t('text')}
                value={textFilter}
                onChange={(e) => {
                    setTextFilter(e.currentTarget.value);
                    setPage(1);
                }}
            />
            <Select
                label={t('status')}
                placeholder={t('allStatuses')}
                data={NotificationStatusEnum.getOptions(t).map((s) => ({ value: String(s.value), label: s.label }))}
                value={statusFilter}
                onChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                }}
                clearable
            />
        </SimpleGrid>
    );

    if (userLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (!targetUser) {
        return <NotFound title={t('userNotFound')} />;
    }

    return (
        <Stack gap="md">
            <UserProfileNav user={targetUser} isOwner={currentUser?.id === targetUser.id} />
            <DataTable
                columns={columns}
                data={notifs}
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
                actions={(n) => (
                    <Group gap="xs" justify="flex-end">
                        {n.status !== NotificationStatusEnum.READ && (
                            <Tooltip label={t('markAsRead')} withArrow>
                                <ActionIcon
                                    size={30}
                                    variant="light"
                                    color="green"
                                    onClick={() => markAsReadMutation.mutate(n.id)}
                                    loading={markAsReadMutation.isPending}
                                >
                                    <IconCheck size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                        <Tooltip label={t('delete')} withArrow>
                            <ActionIcon
                                size={30}
                                color="red"
                                variant="light"
                                onClick={() => deleteMutation.mutate(n.id)}
                                loading={deleteMutation.isPending}
                            >
                                <IconTrash size={16} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                )}
            />
        </Stack>
    );
}
