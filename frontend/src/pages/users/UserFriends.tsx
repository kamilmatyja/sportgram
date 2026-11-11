import { useState, useMemo } from 'react';
import { Group, Text, SimpleGrid, Select, Modal, Button, Stack } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { userService, friendService, type FriendResource, type GetFriendsQuery } from '../../api/services';
import { useAuth } from '../../auth';
import {
    DataTable,
    type Column,
    StatusBadge,
    StatusActionMenu,
    ViewActionButton,
    DeleteActionButton,
    UserSubpageContainer,
    UserInfoCell,
} from '../../components';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { confirmDelete, formatDateTime, notifySuccess, notifyError } from '../../utils';
import { useDataTableState, useUsersMap, useFormErrors } from '../../hooks';
import { useOffline } from '../../services';

export default function UserFriends() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();
    const { isOffline } = useOffline();

    const tableState = useDataTableState({ initialSort: 'createdAt:desc' });
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [addOpened, setAddOpened] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const { errors, setFromError, clearFieldError, clearErrors } = useFormErrors();

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

                const { getUser, isLoading: usersLoading } = useUsersMap(otherUserIds);

                const { data: allUsersData } = useQuery({
                    queryKey: ['potential-friends', targetUser?.id],
                    queryFn: async () => {
                        const res = await userService.getUsers({
                            params: { query: { limit: 50 } },
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
                        if (!currentUser?.id) return;
                        const res = await friendService.getFriends({
                            params: {
                                query: {
                                    filter: { userIds: [currentUser.id, userId] },
                                    limit: 10,
                                },
                            },
                        });
                        const existing = res.data?.find(
                            (f) =>
                                (f.senderUserId === currentUser.id && f.receiverUserId === userId) ||
                                (f.senderUserId === userId && f.receiverUserId === currentUser.id),
                        );
                        if (existing) {
                            if (existing.status === FriendStatusEnum.REJECTED) {
                                await friendService.updateFriendStatus({
                                    params: { path: { id: existing.id } },
                                    body: { status: FriendStatusEnum.PENDING },
                                });
                            }
                            return;
                        }
                        await friendService.createFriend({
                            body: { userId },
                        });
                    },
                    onSuccess: () => {
                        setAddOpened(false);
                        setSelectedUserId(null);
                        clearErrors();
                        void queryClient.invalidateQueries({ queryKey: ['friends'] });
                        notifySuccess(t('saved'), t('friends'));
                    },
                    onError: (err) => setFromError(err),
                });

                const updateStatusMutation = useMutation({
                    mutationFn: ({ id, status }: { id: string; status: number }) =>
                        friendService.updateFriendStatus({
                            params: { path: { id } },
                            body: { status: status as 1 | 2 | 3 | 4 },
                        }),
                    onSuccess: () => {
                        void queryClient.invalidateQueries({ queryKey: ['friends'] });
                        notifySuccess(t('statusUpdated'), t('friends'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

                const deleteMutation = useMutation({
                    mutationFn: (id: string) =>
                        friendService.deleteFriend({
                            params: { path: { id } },
                        }),
                    onSuccess: () => {
                        void queryClient.invalidateQueries({ queryKey: ['friends'] });
                        notifySuccess(t('deleted'), t('friends'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

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
                    <SimpleGrid>
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
                            isLoading={isLoading || (otherUserIds.length > 0 && usersLoading)}
                            totalItems={pagination?.total}
                            state={tableState}
                            filtersNode={filtersNode}
                            activeFiltersCount={statusFilter !== null ? 1 : 0}
                            onResetFilters={handleResetFilters}
                            onAdd={
                                isOwner
                                    ? () => {
                                          clearErrors();
                                          setAddOpened(true);
                                      }
                                    : undefined
                            }
                            addLabel={t('addFriend')}
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
                                                    onClick={() => confirmDelete(t, () => deleteMutation.mutate(f.id))}
                                                    loading={deleteMutation.isPending}
                                                />
                                            </>
                                        )}
                                    </Group>
                                );
                            }}
                        />

                        <Modal
                            opened={addOpened}
                            onClose={() => {
                                setAddOpened(false);
                                clearErrors();
                            }}
                            title={t('addFriend')}
                        >
                            <Stack>
                                <Select
                                    label={t('user')}
                                    placeholder={t('selectUser')}
                                    required
                                    searchable
                                    disabled={isOffline}
                                    data={candidateUsers.map((u) => ({
                                        value: u.id,
                                        label: `${u.firstName} ${u.lastName} (@${u.link})`,
                                    }))}
                                    value={selectedUserId}
                                    error={errors.receiverUserId || errors.userId}
                                    onChange={(val) => {
                                        setSelectedUserId(val);
                                        clearFieldError('receiverUserId');
                                        clearFieldError('userId');
                                    }}
                                />
                                <Button
                                    loading={addFriendMutation.isPending}
                                    disabled={!selectedUserId || addFriendMutation.isPending || isOffline}
                                    onClick={() => selectedUserId && addFriendMutation.mutate(selectedUserId)}
                                >
                                    {t('save')}
                                </Button>
                            </Stack>
                        </Modal>
                    </>
                );
            }}
        </UserSubpageContainer>
    );
}
