import { useState, useMemo } from 'react';
import { Group, Text, SimpleGrid, Select, Modal, Button, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import { userService, friendService, type FriendResource, type GetFriendsQuery } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column } from '../../components/DataTable';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatDateTime } from '../../utils/date';
import { StatusBadge } from '../../components/StatusBadge';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { ViewActionButton, DeleteActionButton } from '../../components/common/RowActionButtons';
import { UserSubpageContainer } from '../../components/common/UserSubpageContainer';
import { useDataTableState } from '../../hooks/useDataTableState';
import { useUsersMap } from '../../hooks/useUsersMap';
import { UserInfoCell } from '../../components/common/UserInfoCell';

export default function UserFriends() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    const tableState = useDataTableState({
        initialSort: 'createdAt:desc',
    });

    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const [addOpened, setAddOpened] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (statusFilter !== null) count++;
        return count;
    }, [statusFilter]);

    const handleResetFilters = () => {
        setStatusFilter(null);
        tableState.setPage(1);
    };

    return (
        <UserSubpageContainer>
            {({ targetUser, isOwner, canAccessSubpage }) => {
                const queryFilter = {
                    userIds: targetUser?.id ? [targetUser.id] : [],
                    status: statusFilter ? (Number(statusFilter) as FriendStatusEnum) : null,
                };

                const { data, isLoading } = useQuery({
                    queryKey: [
                        'friends',
                        targetUser?.id,
                        tableState.page,
                        tableState.limit,
                        tableState.sort,
                        queryFilter,
                    ],
                    queryFn: () => {
                        if (!targetUser?.id) return null;
                        return friendService.getFriends({
                            params: {
                                query: {
                                    page: tableState.page,
                                    limit: tableState.limit,
                                    filter: queryFilter,
                                    sort: (tableState.sort as NonNullable<GetFriendsQuery>['sort']) ?? 'createdAt:desc',
                                },
                            },
                        });
                    },
                    enabled: !!targetUser?.id && canAccessSubpage,
                });

                const friends = data?.data ?? [];
                const pagination = data?.pagination;

                const otherUserIds = useMemo(() => {
                    if (!targetUser) return [];
                    return Array.from(
                        new Set(
                            friends.map((f) => (f.senderUserId === targetUser.id ? f.receiverUserId : f.senderUserId)),
                        ),
                    );
                }, [friends, targetUser]);

                const { getUser } = useUsersMap(otherUserIds);

                const { data: allUsersData } = useQuery({
                    queryKey: ['potential-friends', targetUser?.id],
                    queryFn: async () => {
                        const res = await userService.getUsers({
                            params: {
                                query: { limit: 50 },
                            },
                        });
                        return res.data ?? [];
                    },
                    enabled: addOpened && !!targetUser?.id,
                });

                const candidateUsers = useMemo(() => {
                    const existingIds = new Set(otherUserIds);
                    if (targetUser?.id) existingIds.add(targetUser.id);
                    if (currentUser?.id) existingIds.add(currentUser.id);
                    return (allUsersData ?? []).filter((u) => !existingIds.has(u.id));
                }, [allUsersData, otherUserIds, targetUser?.id, currentUser?.id]);

                const addFriendMutation = useMutation({
                    mutationFn: async (userId: string) => {
                        await friendService.createFriend({
                            body: { userId },
                        });
                    },
                    onSuccess: () => {
                        setAddOpened(false);
                        setSelectedUserId(null);
                        setFieldErrors({});
                        queryClient.invalidateQueries({ queryKey: ['friends'] });
                        notifications.show({ title: t('friend'), message: t('friendRequestSent'), color: 'green' });
                    },
                    onError: (err) => {
                        const fe = extractFieldErrors(err);
                        setFieldErrors(fe);
                        notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
                    },
                });

                const updateStatusMutation = useMutation({
                    mutationFn: ({ id, status }: { id: string; status: number }) =>
                        friendService.updateFriendStatus({
                            params: { path: { id } },
                            body: { status: status as 1 | 2 | 3 | 4 },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['friends'] });
                        notifications.show({ title: t('friend'), message: t('friendStatusUpdated'), color: 'green' });
                    },
                    onError: (err) => {
                        notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
                    },
                });

                const deleteMutation = useMutation({
                    mutationFn: (id: string) =>
                        friendService.deleteFriend({
                            params: { path: { id } },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['friends'] });
                        notifications.show({ title: t('friend'), message: t('friendRemoved'), color: 'green' });
                    },
                    onError: (err) => {
                        notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
                    },
                });

                const handleDelete = (id: string) => {
                    openConfirmActionModal({
                        title: t('confirmFriendRemovalTitle'),
                        message: t('confirmFriendRemovalMessage'),
                        confirmLabel: t('delete'),
                        cancelLabel: t('cancel'),
                        onConfirm: () => deleteMutation.mutate(id),
                    });
                };

                const columns: Column<FriendResource>[] = [
                    {
                        key: 'user',
                        header: t('user'),
                        render: (f) => {
                            const otherId = f.senderUserId === targetUser?.id ? f.receiverUserId : f.senderUserId;
                            return <UserInfoCell user={getUser(otherId)} userId={otherId} />;
                        },
                    },
                    {
                        key: 'status',
                        header: t('status'),
                        render: (f) => <StatusBadge status={f.status} type="friend" />,
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
                            data={FriendStatusEnum.getOptions(t).map((s) => ({
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
                    </SimpleGrid>
                );

                return (
                    <>
                        <DataTable
                            columns={columns}
                            data={friends}
                            isLoading={isLoading}
                            totalItems={pagination?.total}
                            state={tableState}
                            filtersNode={filtersNode}
                            activeFiltersCount={activeFiltersCount}
                            onResetFilters={handleResetFilters}
                            onAdd={isOwner ? () => setAddOpened(true) : undefined}
                            actions={(f) => {
                                const otherId = f.senderUserId === targetUser?.id ? f.receiverUserId : f.senderUserId;
                                const otherUser = getUser(otherId);

                                return (
                                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                                        {otherUser?.link && <ViewActionButton to={`/users/${otherUser.link}`} />}
                                        {isOwner && (
                                            <>
                                                <StatusActionMenu
                                                    value={f.status}
                                                    enumType={FriendStatusEnum}
                                                    onChange={(st) =>
                                                        updateStatusMutation.mutate({
                                                            id: f.id,
                                                            status: Number(st),
                                                        })
                                                    }
                                                    loading={updateStatusMutation.isPending}
                                                />
                                                <DeleteActionButton
                                                    onClick={() => handleDelete(f.id)}
                                                    loading={deleteMutation.isPending}
                                                />
                                            </>
                                        )}
                                    </Group>
                                );
                            }}
                        />

                        <Modal opened={addOpened} onClose={() => setAddOpened(false)} title={t('add')}>
                            <Stack gap="md">
                                <Select
                                    label={t('user')}
                                    placeholder={t('selectUser')}
                                    required
                                    searchable
                                    data={candidateUsers.map((u) => ({
                                        value: u.id,
                                        label: `${u.firstName} ${u.lastName} (@${u.link})`,
                                    }))}
                                    value={selectedUserId}
                                    error={fieldErrors.receiverUserId || fieldErrors.userId}
                                    onChange={setSelectedUserId}
                                />
                                <Button
                                    loading={addFriendMutation.isPending}
                                    disabled={!selectedUserId || addFriendMutation.isPending}
                                    onClick={() => selectedUserId && addFriendMutation.mutate(selectedUserId)}
                                >
                                    {t('add')}
                                </Button>
                            </Stack>
                        </Modal>
                    </>
                );
            }}
        </UserSubpageContainer>
    );
}
