import { useState } from 'react';
import { Group, Text, SimpleGrid, TextInput, Select } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { notificationService, type NotificationResource, type GetNotificationsQuery } from '../../api/services';
import { useAuth } from '../../auth';
import { DataTable, type Column } from '../../components';
import {
    StatusBadge,
    StatusActionMenu,
    ViewActionButton,
    DeleteActionButton,
    UserSubpageContainer,
} from '../../components';
import { NotificationStatusEnum } from '../../enums/NotificationStatusEnum';
import { useDataTableState } from '../../hooks';
import { notifySuccess, notifyError, confirmDelete, formatDateTime, buildSortOptions, truncate } from '../../utils';

export default function UserNotifications() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    const tableState = useDataTableState({ defaultSort: 'createdAt:desc' });

    const [textFilter, setTextFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const sortOptions = buildSortOptions(t, ['createdAt', 'text', 'status']);
    const activeFiltersCount = [textFilter.trim(), statusFilter].filter(Boolean).length;

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
                        void queryClient.invalidateQueries({ queryKey: ['notifications'] });
                        notifySuccess(t('statusUpdated'), t('notifications'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

                const deleteMutation = useMutation({
                    mutationFn: (id: string) => notificationService.deleteNotification({ params: { path: { id } } }),
                    onSuccess: () => {
                        void queryClient.invalidateQueries({ queryKey: ['notifications'] });
                        notifySuccess(t('deleted'), t('notifications'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

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
                    <SimpleGrid>
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
                                        onClick={() => confirmDelete(t, () => deleteMutation.mutate(n.id))}
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
