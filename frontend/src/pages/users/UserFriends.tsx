import { useState, useMemo } from 'react';
import NotFound from '../../components/NotFound';
import {
    Avatar,
    Group,
    Text,
    Badge,
    Stack,
    SimpleGrid,
    Select,
    Center,
    Loader,
    ActionIcon,
    Tooltip,
    Modal,
    Button,
    Menu,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAdjustments, IconTrash, IconEye } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { getErrorMessage, extractFieldErrors } from '../../api/client';
import {
    userService,
    friendService,
    type FriendResource,
    type UserResource,
    type GetFriendsQuery,
} from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { useUserSubpageAccess } from '../../hooks/useUserSubpageAccess';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import UserProfileNav from '../../components/UserProfileNav';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatImageSrc } from '../../utils/imageUtils';

export default function UserFriends() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser, isAdmin } = useAuth();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>('createdAt:desc');

    // Filters
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    // Add friend modal
    const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
            userIds: targetUser?.id ? [targetUser.id] : [],
            status: statusFilter ? (Number(statusFilter) as FriendStatusEnum) : null,
        };
    }, [targetUser?.id, statusFilter]);

    const { data, isLoading } = useQuery({
        queryKey: ['friends', targetUser?.id, page, limit, sort, queryFilter],
        queryFn: () => {
            if (!targetUser?.id) return null;
            return friendService.getFriends({
                page,
                limit,
                filter: queryFilter,
                sort: (sort as NonNullable<GetFriendsQuery>['sort']) ?? 'createdAt:desc',
            });
        },
        enabled: !!targetUser?.id && canAccessSubpage,
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

    // Candidates for adding as friend (excluding current user and existing friends)
    const { data: allUsersData } = useQuery({
        queryKey: ['potential-friends', targetUser?.id],
        queryFn: async () => {
            const res = await userService.getUsers({ limit: 50 });
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
            await friendService.sendFriendRequest(userId);
        },
        onSuccess: () => {
            closeAdd();
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
        mutationFn: ({ id, status }: { id: string; status: number }) => friendService.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friends'] });
            notifications.show({ title: t('friend'), message: t('friendStatusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => friendService.deleteFriend(id),
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

    const filtersNode = (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <Select
                label={t('status')}
                placeholder={t('allStatuses')}
                data={FriendStatusEnum.getOptions(t).map((s) => ({ value: String(s.value), label: s.label }))}
                value={statusFilter}
                onChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                }}
                clearable
            />
        </SimpleGrid>
    );

    const columns: Column<FriendResource>[] = [
        {
            key: 'user',
            header: t('user'),
            render: (f) => {
                const otherId = f.senderUserId === targetUser?.id ? f.receiverUserId : f.senderUserId;
                const otherUser = relatedUsers[otherId];
                return (
                    <Group gap="sm">
                        <Avatar src={formatImageSrc(otherUser?.profilePhoto)} radius={5}>
                            ?
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
                let label = '';
                switch (f.status) {
                    case FriendStatusEnum.PENDING:
                        color = 'yellow';
                        label = t('friends.pending');
                        break;
                    case FriendStatusEnum.ACCEPTED:
                        color = 'green';
                        label = t('friends.accepted');
                        break;
                    case FriendStatusEnum.REJECTED:
                        color = 'red';
                        label = t('friends.rejected');
                        break;
                    case FriendStatusEnum.BLOCKED:
                        color = 'dark';
                        label = t('friends.blocked');
                        break;
                }
                return (
                    <Badge color={color} variant="light">
                        {label}
                    </Badge>
                );
            },
        },
        {
            key: 'createdAt',
            header: t('createdAt'),
            render: (f) => (
                <Text size="xs" c="dimmed">
                    {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : '-'}
                </Text>
            ),
        },
    ];

    return (
        <Stack gap="lg">
            <UserProfileNav user={targetUser} />

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
                onAdd={isOwner ? openAdd : undefined}
                addLabel={t('addFriend')}
                actions={(f) => {
                    const isParticipant = f.senderUserId === currentUser?.id || f.receiverUserId === currentUser?.id;
                    const canEditStatus = isOwner || isParticipant || isAdmin;
                    const canDelete = isOwner || isAdmin;
                    const otherId = f.senderUserId === targetUser?.id ? f.receiverUserId : f.senderUserId;
                    const otherUser = relatedUsers[otherId];

                    return (
                        <Group gap="xs" justify="flex-end" wrap="nowrap">
                            {otherUser && (
                                <Tooltip label={t('details')} withArrow>
                                    <ActionIcon
                                        component={Link}
                                        to={`/users/${otherUser.link ?? otherId}`}
                                        variant="light"
                                        size={30}
                                        aria-label={t('details')}
                                    >
                                        <IconEye size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            )}

                            {canEditStatus && (
                                <Menu shadow="md" width={160} position="bottom-end">
                                    <Menu.Target>
                                        <Tooltip label={t('changeStatus')} withArrow>
                                            <ActionIcon
                                                variant="light"
                                                size={30}
                                                aria-label={t('changeStatus')}
                                                loading={updateStatusMutation.isPending}
                                            >
                                                <IconAdjustments size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        {FriendStatusEnum.getOptions(t).map((opt) => (
                                            <Menu.Item
                                                key={opt.value}
                                                disabled={f.status === opt.value || updateStatusMutation.isPending}
                                                onClick={() =>
                                                    updateStatusMutation.mutate({
                                                        id: f.id,
                                                        status: opt.value as FriendStatusEnum,
                                                    })
                                                }
                                            >
                                                {opt.label}
                                            </Menu.Item>
                                        ))}
                                    </Menu.Dropdown>
                                </Menu>
                            )}

                            {canDelete && (
                                <Tooltip label={t('delete')} withArrow>
                                    <ActionIcon
                                        size={30}
                                        color="red"
                                        variant="light"
                                        onClick={() => handleDelete(f.id)}
                                        loading={deleteMutation.isPending}
                                        disabled={deleteMutation.isPending}
                                        aria-label={t('delete')}
                                    >
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            )}
                        </Group>
                    );
                }}
            />

            {/* Add friend modal */}
            <Modal opened={addOpened} onClose={closeAdd} title={t('addFriend')} size="md">
                <Stack gap="sm">
                    <Select
                        label={t('user')}
                        placeholder={t('select')}
                        data={candidateUsers.map((u) => ({
                            value: u.id,
                            label: `${u.firstName} ${u.lastName} (@${u.link})`,
                        }))}
                        value={selectedUserId}
                        onChange={setSelectedUserId}
                        searchable
                        clearable
                        required
                        error={fieldErrors.userId}
                    />
                    <Button
                        loading={addFriendMutation.isPending}
                        disabled={addFriendMutation.isPending || !selectedUserId}
                        onClick={() => selectedUserId && addFriendMutation.mutate(selectedUserId)}
                    >
                        {t('add')}
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
