import { useState, useMemo } from 'react';
import { Avatar, Group, Text, Button, Badge, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconTrash, IconMessage } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import { userService, friendService, type FriendResource, type UserResource } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';

export default function UserFriends() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser, isAdmin } = useAuth();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const { data: targetUser } = useQuery({
        queryKey: ['user', link],
        queryFn: () => userService.getUserByLink(link || ''),
        enabled: !!link,
    });

    const isOwner = currentUser?.id === targetUser?.id;

    const { data, isLoading } = useQuery({
        queryKey: ['friends', targetUser?.id, page, limit],
        queryFn: () => {
            if (!targetUser?.id) return null;
            return friendService.getFriends({
                page,
                limit,
                filter: { userIds: [targetUser.id] },
                sort: 'createdAt:desc',
            });
        },
        enabled: !!targetUser?.id,
    });

    const friends = data?.data ?? [];
    const pagination = data?.pagination;

    // Extract other user IDs to fetch their details
    const otherUserIds = useMemo(() => {
        if (!targetUser) return [];
        return Array.from(
            new Set(friends.map((f) => (f.senderUserId === targetUser.id ? f.receiverUserId : f.senderUserId))),
        );
    }, [friends, targetUser]);

    const { data: relatedUsersData } = useQuery({
        queryKey: ['related-users', otherUserIds],
        queryFn: async () => {
            if (otherUserIds.length === 0) return {};
            const users = await userService.getUsersByIds(otherUserIds);
            const map: Record<string, UserResource> = {};
            users.forEach((u) => {
                map[u.id] = u;
            });
            return map;
        },
        enabled: otherUserIds.length > 0,
    });

    const relatedUsers = relatedUsersData ?? {};

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: number }) => friendService.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friends'] });
            notifications.show({ title: t('friends'), message: t('saved'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => friendService.deleteFriend(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friends'] });
            notifications.show({ title: t('friends'), message: t('deleted'), color: 'blue' });
        },
    });

    const columns: Column<FriendResource>[] = [
        {
            key: 'user',
            header: t('user'),
            render: (f) => {
                const otherId = f.senderUserId === targetUser?.id ? f.receiverUserId : f.senderUserId;
                const otherUser = relatedUsers[otherId];
                return (
                    <Group gap="sm">
                        <Avatar src={otherUser?.profilePhoto || undefined} radius="xl">
                            {otherUser?.firstName?.[0] ?? '?'}
                        </Avatar>
                        <div>
                            <Text
                                size="sm"
                                fw={600}
                                component={Link}
                                to={`/users/${otherUser?.link ?? otherId}`}
                                className="no-decoration"
                            >
                                {otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : otherId}
                            </Text>
                            {otherUser?.link && (
                                <Text size="xs" c="dimmed">
                                    @{otherUser.link}
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
                let label = t('unknown');
                if (f.status === FriendStatusEnum.ACCEPTED) {
                    color = 'green';
                    label = t('friends.accepted');
                } else if (f.status === FriendStatusEnum.PENDING) {
                    color = 'yellow';
                    label = t('friends.pending');
                } else if (f.status === FriendStatusEnum.REJECTED) {
                    color = 'red';
                    label = t('friends.rejected');
                }
                return (
                    <Badge color={color} size="xs" variant="light">
                        {label}
                    </Badge>
                );
            },
        },
    ];

    return (
        <Stack gap="md">
            {targetUser && <UserProfileNav user={targetUser} />}
            <DataTable
                columns={columns}
                data={friends}
                isLoading={isLoading}
                page={page}
                totalItems={pagination?.total}
                onPageChange={setPage}
                limit={limit}
                onLimitChange={(l) => {
                    setLimit(l);
                    setPage(1);
                }}
                actions={(f) => {
                    const canManage = isOwner || isAdmin;
                    const isReceiver = f.receiverUserId === currentUser?.id;
                    const otherId = f.senderUserId === targetUser?.id ? f.receiverUserId : f.senderUserId;
                    const otherUser = relatedUsers[otherId];

                    return (
                        <Group gap="xs" justify="flex-end">
                            {canManage && isReceiver && f.status === FriendStatusEnum.PENDING && (
                                <>
                                    <Button
                                        size="xs"
                                        color="green"
                                        variant="light"
                                        leftSection={<IconCheck size={14} />}
                                        onClick={() =>
                                            updateStatusMutation.mutate({ id: f.id, status: FriendStatusEnum.ACCEPTED })
                                        }
                                    >
                                        {t('accept')}
                                    </Button>
                                    <Button
                                        size="xs"
                                        color="red"
                                        variant="subtle"
                                        leftSection={<IconX size={14} />}
                                        onClick={() =>
                                            updateStatusMutation.mutate({ id: f.id, status: FriendStatusEnum.REJECTED })
                                        }
                                    >
                                        {t('reject')}
                                    </Button>
                                </>
                            )}

                            {f.status === FriendStatusEnum.ACCEPTED && otherUser && (
                                <Button
                                    component={Link}
                                    to={`/users/${otherUser.link}/conversations`}
                                    variant="light"
                                    size="xs"
                                    leftSection={<IconMessage size={14} />}
                                >
                                    {t('chat')}
                                </Button>
                            )}

                            {canManage && (
                                <Button
                                    size="xs"
                                    color="red"
                                    variant="subtle"
                                    leftSection={<IconTrash size={14} />}
                                    onClick={() => deleteMutation.mutate(f.id)}
                                >
                                    {t('delete')}
                                </Button>
                            )}
                        </Group>
                    );
                }}
            />
        </Stack>
    );
}
