import { useState, useMemo } from 'react';
import NotFound from '../../components/NotFound';
import {
    Group,
    Text,
    Badge,
    Stack,
    SimpleGrid,
    TextInput,
    Select,
    Center,
    Loader,
    ActionIcon,
    Tooltip,
    Menu,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconAdjustments, IconEye } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import {
    userService,
    notificationService,
    type NotificationResource,
    type GetNotificationsQuery,
} from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { useUserSubpageAccess } from '../../hooks/useUserSubpageAccess';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { NotificationStatusEnum } from '../../enums/NotificationStatusEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { getErrorMessage } from '../../api/client';
import { formatDateTime } from '../../utils/date';
import { truncate } from '../../utils/text';

export default function UserNotifications() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>('createdAt:desc');

    const [textFilter, setTextFilter] = useState('');
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
        ownerOrAdminOnly: true,
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
        queryKey: ['notifications', targetUser?.id, page, limit, sort, queryFilter],
        queryFn: () => {
            if (!currentUser?.id) return null;
            return notificationService.getNotifications({
                page,
                limit,
                filter: queryFilter,
                sort: (sort as NonNullable<GetNotificationsQuery>['sort']) ?? 'createdAt:desc',
            });
        },
        enabled: !!currentUser?.id && canAccessSubpage,
    });

    const notifs = data?.data ?? [];
    const pagination = data?.pagination;

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: NotificationStatusEnum }) =>
            notificationService.updateNotificationStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            notifications.show({ title: t('notifications'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => notificationService.deleteNotification(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            notifications.show({ title: t('notifications'), message: t('deleted'), color: 'green' });
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

    const columns: Column<NotificationResource>[] = [
        {
            key: 'text',
            header: t('text'),
            render: (n) => (
                <Text size="sm" fw={n.status !== NotificationStatusEnum.READ ? 600 : 400} title={n.text}>
                    {truncate(n.text, 50)}
                </Text>
            ),
        },
        {
            key: 'status',
            header: t('status'),
            render: (n) => {
                const isRead = n.status === NotificationStatusEnum.READ;
                return (
                    <Badge color={isRead ? 'green' : 'gray'} variant="light">
                        {isRead ? t('notificationStatuses.read') : t('notificationStatuses.sent')}
                    </Badge>
                );
            },
        },
        {
            key: 'createdAt',
            header: t('createdAt'),
            render: (n) => (
                <Text size="xs" c="dimmed">
                    {formatDateTime(n.createdAt)}
                </Text>
            ),
        },
    ];

    const filtersNode = (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
                label={t('text')}
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
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                        {n.link && (
                            <Tooltip label={t('details')} withArrow>
                                <ActionIcon
                                    component={Link}
                                    to={n.link}
                                    variant="light"
                                    size={30}
                                    aria-label={t('details')}
                                >
                                    <IconEye size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}

                        <Menu shadow="md" width={160}>
                            <Menu.Target>
                                <Tooltip label={t('changeStatus')} withArrow>
                                    <ActionIcon variant="light" size={30} aria-label={t('changeStatus')}>
                                        <IconAdjustments size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            </Menu.Target>
                            <Menu.Dropdown>
                                {NotificationStatusEnum.getOptions(t).map((opt) => (
                                    <Menu.Item
                                        key={opt.value}
                                        disabled={n.status === opt.value || updateStatusMutation.isPending}
                                        onClick={() => updateStatusMutation.mutate({ id: n.id, status: opt.value })}
                                    >
                                        {opt.label}
                                    </Menu.Item>
                                ))}
                            </Menu.Dropdown>
                        </Menu>

                        {isOwner && (
                            <Tooltip label={t('delete')} withArrow>
                                <ActionIcon
                                    size={30}
                                    color="red"
                                    variant="light"
                                    onClick={() => handleDelete(n.id)}
                                    loading={deleteMutation.isPending}
                                    disabled={deleteMutation.isPending}
                                    aria-label={t('delete')}
                                >
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </Group>
                )}
            />
        </Stack>
    );
}
