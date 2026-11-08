import { useState, useMemo } from 'react';
import { Group, Text, SimpleGrid, TextInput, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { notificationService, type NotificationResource, type GetNotificationsQuery } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column } from '../../components/DataTable';
import { NotificationStatusEnum } from '../../enums/NotificationStatusEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { getErrorMessage } from '../../api/client';
import { formatDateTime } from '../../utils/date';
import { truncate } from '../../utils/text';
import { buildSortOptions } from '../../utils/tableUtils';
import { UserSubpageContainer } from '../../components/common/UserSubpageContainer';
import { useDataTableState } from '../../hooks/useDataTableState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { ViewActionButton, DeleteActionButton } from '../../components/common/RowActionButtons';

export default function UserNotifications() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    const tableState = useDataTableState({
        defaultSort: 'createdAt:desc',
    });

    const [textFilter, setTextFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

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
        <UserSubpageContainer ownerOrAdminOnly={true}>
            {({ targetUser, isOwner }) => {
                const queryFilter = {
                    text: textFilter.trim() || null,
                    status: statusFilter ? (Number(statusFilter) as NotificationStatusEnum) : null,
                };

                const { data, isLoading } = useQuery({
                    queryKey: [
                        'notifications',
                        targetUser.id,
                        tableState.page,
                        tableState.limit,
                        tableState.sort,
                        queryFilter,
                    ],
                    queryFn: () => {
                        if (!currentUser?.id) return null;
                        return notificationService.getNotifications({
                            params: {
                                query: {
                                    page: tableState.page,
                                    limit: tableState.limit,
                                    filter: queryFilter,
                                    sort:
                                        (tableState.sort as NonNullable<GetNotificationsQuery>['sort']) ??
                                        'createdAt:desc',
                                },
                            },
                        });
                    },
                    enabled: !!currentUser?.id,
                });

                const notifs = data?.data ?? [];
                const pagination = data?.pagination;

                const updateStatusMutation = useMutation({
                    mutationFn: ({ id, status }: { id: string; status: NotificationStatusEnum }) =>
                        notificationService.updateNotificationStatus({
                            params: { path: { id } },
                            body: { status },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['notifications'] });
                        notifications.show({
                            title: t('notifications'),
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
                    mutationFn: (id: string) =>
                        notificationService.deleteNotification({
                            params: { path: { id } },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['notifications'] });
                        notifications.show({
                            title: t('notifications'),
                            message: t('deleted'),
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

                const columns: Column<NotificationResource>[] = [
                    {
                        key: 'text',
                        header: t('text'),
                        render: (n) => (
                            <Text size="sm" title={n.text}>
                                {truncate(n.text, 50)}
                            </Text>
                        ),
                    },
                    {
                        key: 'status',
                        header: t('status'),
                        render: (n) => <StatusBadge status={n.status} enumType={NotificationStatusEnum} />,
                    },
                    {
                        key: 'createdAt',
                        header: t('createdAt'),
                        render: (n) => (
                            <Text size="sm" c="dimmed">
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
                                tableState.resetPage();
                            }}
                        />
                        <Select
                            label={t('status')}
                            placeholder={t('allStatuses')}
                            data={NotificationStatusEnum.getOptions(t).map((s) => ({
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
                    <DataTable
                        columns={columns}
                        data={notifs}
                        isLoading={isLoading}
                        totalItems={pagination?.total}
                        state={tableState}
                        sortOptions={sortOptions}
                        filtersNode={filtersNode}
                        activeFiltersCount={activeFiltersCount}
                        onResetFilters={handleResetFilters}
                        actions={(n) => (
                            <Group gap="xs" justify="flex-end" wrap="nowrap">
                                {n.link && <ViewActionButton to={n.link} />}
                                <StatusActionMenu
                                    value={n.status}
                                    enumType={NotificationStatusEnum}
                                    onChange={(status) =>
                                        updateStatusMutation.mutate({
                                            id: n.id,
                                            status: status as NotificationStatusEnum,
                                        })
                                    }
                                    loading={updateStatusMutation.isPending}
                                />
                                {isOwner && (
                                    <DeleteActionButton
                                        onClick={() => handleDelete(n.id)}
                                        loading={deleteMutation.isPending}
                                    />
                                )}
                            </Group>
                        )}
                    />
                );
            }}
        </UserSubpageContainer>
    );
}
