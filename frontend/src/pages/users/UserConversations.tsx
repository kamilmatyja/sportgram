import { useState, useMemo, useRef, useEffect, type SyntheticEvent } from 'react';
import {
    Title,
    Text,
    Group,
    TextInput,
    Button,
    Stack,
    Avatar,
    Badge,
    ActionIcon,
    Tooltip,
    Center,
    Loader,
    Select,
    Menu,
    Modal,
    Card,
    Paper,
    ScrollArea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSend, IconTrash, IconAdjustments, IconEdit, IconMessage } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import NotFound from '../../components/NotFound';
import { EmptyState } from '../../components/EmptyState';
import { getErrorMessage } from '../../api/client';
import {
    conversationService,
    userService,
    friendService,
    type UserResource,
    type ConversationResource,
} from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { useUserSubpageAccess } from '../../hooks/useUserSubpageAccess';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { ConversationStatusEnum } from '../../enums/ConversationStatusEnum';
import UserProfileNav from '../../components/UserProfileNav';
import { formatImageSrc } from '../../utils/imageUtils';
import { openConfirmActionModal } from '../../utils/confirmModal';

export default function UserConversations() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [messageInput, setMessageInput] = useState('');
    const [statusFilter, setStatusFilter] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>('createdAt:desc');

    // Edit modal state
    const [editModalOpened, setEditModalOpened] = useState(false);
    const [editingMessage, setEditingMessage] = useState<ConversationResource | null>(null);
    const [editModalText, setEditModalText] = useState('');

    // Send modal state (used when owner starts a conversation from onAdd)
    const [sendModalOpened, setSendModalOpened] = useState(false);
    const [sendModalRecipientId, setSendModalRecipientId] = useState<string | null>(null);
    const [sendModalText, setSendModalText] = useState('');

    // Target user from route link
    const { data: targetUser, isLoading: userLoading } = useQuery({
        queryKey: ['user', link],
        queryFn: async () => {
            if (!link) return null;
            return await userService.getUserByLink(link);
        },
        enabled: !!link,
    });

    const {
        isOwner,
        canAccessSubpage,
        isLoading: accessLoading,
    } = useUserSubpageAccess({
        targetUser,
    });

    // Check friendship with target user when visiting someone else's profile
    const { data: friendship } = useQuery({
        queryKey: ['friendship', currentUser?.id, targetUser?.id],
        queryFn: async () => {
            if (!currentUser || !targetUser || isOwner) return null;
            const res = await friendService.getFriends({
                filter: { userIds: [targetUser.id] },
                limit: 10,
            });
            return (
                res.data?.find(
                    (f) =>
                        (f.senderUserId === targetUser.id && f.receiverUserId === currentUser.id) ||
                        (f.senderUserId === currentUser.id && f.receiverUserId === targetUser.id),
                ) ?? null
            );
        },
        enabled: !!currentUser && !!targetUser && !isOwner,
    });

    const canChat = !isOwner && friendship?.status === FriendStatusEnum.ACCEPTED;

    // For owner: fetch friends for the "New conversation" modal
    const { data: myFriendsRes } = useQuery({
        queryKey: ['my-friends-for-conversations', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return [];
            const res = await friendService.getFriends({
                filter: { userIds: [currentUser.id], status: FriendStatusEnum.ACCEPTED },
                limit: 100,
            });
            return res.data ?? [];
        },
        enabled: isOwner && !!currentUser,
    });

    const friendPartnerIds = useMemo(() => {
        if (!currentUser || !myFriendsRes) return [];
        const set = new Set<string>();
        myFriendsRes.forEach((f) => {
            const partnerId = f.senderUserId === currentUser.id ? f.receiverUserId : f.senderUserId;
            if (partnerId) set.add(partnerId);
        });
        return Array.from(set);
    }, [currentUser, myFriendsRes]);

    const { data: friendUsersMap } = useQuery({
        queryKey: ['friend-users-map', friendPartnerIds],
        queryFn: async () => {
            if (friendPartnerIds.length === 0) return {};
            const users = await userService.getUsersByIds(friendPartnerIds);
            const map: Record<string, UserResource> = {};
            users.forEach((u) => {
                map[u.id] = u;
            });
            return map;
        },
        enabled: friendPartnerIds.length > 0,
    });

    // Fetch conversations list or chat messages from /api/conversations
    // Filter userId ALWAYS contains the owner's id (targetUser.id)
    const { data: conversationsResponse, isLoading: conversationsLoading } = useQuery({
        queryKey: [
            'conversations-data',
            currentUser?.id,
            targetUser?.id,
            isOwner,
            isOwner ? page : 1,
            isOwner ? limit : 100,
            isOwner ? sort : 'createdAt:asc',
            isOwner ? statusFilter : null,
        ],
        queryFn: async () => {
            if (!currentUser || !targetUser) return { data: [], pagination: null };
            return await conversationService.getConversations({
                page: isOwner ? page : 1,
                limit: isOwner ? limit : 100,
                sort: isOwner ? ((sort as any) ?? 'createdAt:desc') : 'createdAt:asc',
                filter: {
                    userId: targetUser.id,
                    ...(isOwner && statusFilter ? { status: statusFilter as any } : {}),
                },
            });
        },
        enabled: !!currentUser && !!targetUser && canAccessSubpage,
        refetchInterval: isOwner ? 10000 : 3000,
    });

    // Collect user IDs present in the conversations to fetch their profiles for the table
    const userIdsToFetch = useMemo(() => {
        if (!isOwner) return [];
        const set = new Set<string>();
        conversationsResponse?.data?.forEach((c) => {
            if (c.senderUserId) set.add(c.senderUserId);
            if (c.receiverUserId) set.add(c.receiverUserId);
        });
        return Array.from(set);
    }, [isOwner, conversationsResponse?.data]);

    const { data: relatedUsersMap } = useQuery({
        queryKey: ['conversation-related-users', userIdsToFetch],
        queryFn: async () => {
            if (userIdsToFetch.length === 0) return {};
            const users = await userService.getUsersByIds(userIdsToFetch);
            const map: Record<string, UserResource> = {};
            users.forEach((u) => {
                map[u.id] = u;
            });
            return map;
        },
        enabled: userIdsToFetch.length > 0,
    });

    const relatedUsers = relatedUsersMap ?? {};

    // Auto-scroll to bottom of chat when messages update
    useEffect(() => {
        if (!isOwner) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isOwner, conversationsResponse?.data]);

    // Mutations
    const sendMutation = useMutation({
        mutationFn: async ({ recipientId, text }: { recipientId: string; text: string }) => {
            await conversationService.sendMessage(recipientId, text);
        },
        onSuccess: () => {
            setMessageInput('');
            setSendModalText('');
            setSendModalOpened(false);
            queryClient.invalidateQueries({ queryKey: ['conversations-data'] });
            notifications.show({ title: t('conversations'), message: t('messageSent'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateMessageMutation = useMutation({
        mutationFn: ({ id, text }: { id: string; text: string }) =>
            conversationService.updateConversation(id, { text }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations-data'] });
            notifications.show({ title: t('conversations'), message: t('messageUpdated'), color: 'green' });
            setEditModalOpened(false);
            setEditingMessage(null);
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: ConversationStatusEnum }) =>
            conversationService.updateConversationStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations-data'] });
            notifications.show({ title: t('conversations'), message: t('statusUpdated'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const deleteMessageMutation = useMutation({
        mutationFn: (id: string) => conversationService.deleteConversation(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations-data'] });
            notifications.show({ title: t('conversations'), message: t('deleted'), color: 'green' });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleDeleteMessage = (id: string) => {
        openConfirmActionModal({
            title: t('confirmDeleteTitle'),
            message: t('confirmDeleteMessage'),
            confirmLabel: t('delete'),
            cancelLabel: t('cancel'),
            onConfirm: () => deleteMessageMutation.mutate(id),
        });
    };

    const handleSendChat = (e: SyntheticEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !targetUser?.id || !canChat || sendMutation.isPending) return;
        sendMutation.mutate({ recipientId: targetUser.id, text: messageInput.trim() });
    };

    const sortOptions: SortOption[] = [
        { value: 'createdAt:desc', label: t('sort_createdAt_desc') },
        { value: 'createdAt:asc', label: t('sort_createdAt_asc') },
        { value: 'status:desc', label: t('sort_status_desc') },
        { value: 'status:asc', label: t('sort_status_asc') },
    ];

    const conversationColumns: Column<ConversationResource>[] = [
        {
            key: 'user',
            header: t('user'),
            render: (c) => {
                const otherId = c.senderUserId === currentUser?.id ? c.receiverUserId : c.senderUserId;
                const other = relatedUsers[otherId];
                return (
                    <Group gap="sm">
                        <Avatar src={formatImageSrc(other?.profilePhoto)} radius={5}>
                            ?
                        </Avatar>
                        <div>
                            <Text size="sm" fw={600}>
                                {other ? `${other.firstName} ${other.lastName}` : otherId}
                            </Text>
                            {other?.link && (
                                <Text size="xs" c="dimmed">
                                    @{other.link}
                                </Text>
                            )}
                        </div>
                    </Group>
                );
            },
        },
        {
            key: 'text',
            header: t('text'),
            render: (c) => <Text size="sm">{c.text}</Text>,
        },
        {
            key: 'status',
            header: t('status'),
            render: (c) => {
                const isSent = c.status === ConversationStatusEnum.SENT;
                return (
                    <Badge color={isSent ? 'blue' : 'gray'} variant="light">
                        {isSent ? t('conversationStatuses.sent') : t('conversationStatuses.read')}
                    </Badge>
                );
            },
        },
        {
            key: 'createdAt',
            header: t('createdAt'),
            render: (c) => (
                <Text size="xs" c="dimmed">
                    {c.createdAt ? new Date(c.createdAt).toLocaleString() : '-'}
                </Text>
            ),
        },
    ];

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

    const friendSelectOptions = friendPartnerIds.map((id) => {
        const u = friendUsersMap?.[id];
        return {
            value: id,
            label: u ? `${u.firstName} ${u.lastName} (@${u.link})` : id,
        };
    });

    const statusSelectOptions = [
        { value: '', label: t('allStatuses') },
        ...ConversationStatusEnum.getOptions(t).map((opt) => ({
            value: String(opt.value),
            label: opt.label,
        })),
    ];

    const messages = conversationsResponse?.data ?? [];

    // When viewer = owner (isOwner): display conversation table
    if (isOwner) {
        return (
            <Stack gap="md">
                <UserProfileNav user={targetUser} isOwner={true} />
                <Title order={3}>{t('conversations')}</Title>

                <DataTable
                    columns={conversationColumns}
                    data={messages}
                    isLoading={conversationsLoading}
                    page={page}
                    totalItems={conversationsResponse?.pagination?.total ?? messages.length}
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
                    filtersNode={
                        <Group gap="sm">
                            <Select
                                placeholder={t('allStatuses')}
                                data={statusSelectOptions}
                                value={statusFilter ? String(statusFilter) : ''}
                                onChange={(val) => {
                                    setStatusFilter(val ? Number(val) : null);
                                    setPage(1);
                                }}
                                clearable
                                w={180}
                            />
                        </Group>
                    }
                    hasActiveFilters={statusFilter !== null}
                    activeFiltersCount={statusFilter !== null ? 1 : 0}
                    onResetFilters={() => {
                        setStatusFilter(null);
                        setPage(1);
                    }}
                    onAdd={() => {
                        setSendModalRecipientId(friendPartnerIds[0] || null);
                        setSendModalText('');
                        setSendModalOpened(true);
                    }}
                    addLabel={t('sendMessage')}
                    actions={(c) => {
                        const isSender = c.senderUserId === currentUser?.id;
                        const isReceiver = c.receiverUserId === currentUser?.id;
                        const otherId = isSender ? c.receiverUserId : c.senderUserId;
                        const other = relatedUsers[otherId];

                        return (
                            <Group gap="xs" justify="flex-end" wrap="nowrap">
                                <Tooltip label={t('chat')} withArrow>
                                    <ActionIcon
                                        component={Link}
                                        to={`/users/${other?.link ?? otherId}/conversations`}
                                        variant="light"
                                        size={30}
                                        aria-label={t('chat')}
                                    >
                                        <IconMessage size={16} />
                                    </ActionIcon>
                                </Tooltip>
                                {isSender && (
                                    <>
                                        <Tooltip label={t('edit')} withArrow>
                                            <ActionIcon
                                                variant="light"
                                                size={30}
                                                onClick={() => {
                                                    setEditingMessage(c);
                                                    setEditModalText(c.text);
                                                    setEditModalOpened(true);
                                                }}
                                                aria-label={t('edit')}
                                            >
                                                <IconEdit size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label={t('delete')} withArrow>
                                            <ActionIcon
                                                variant="light"
                                                color="red"
                                                size={30}
                                                onClick={() => handleDeleteMessage(c.id)}
                                                loading={deleteMessageMutation.isPending}
                                                disabled={deleteMessageMutation.isPending}
                                                aria-label={t('delete')}
                                            >
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </>
                                )}
                                {isReceiver && (
                                    <Menu shadow="md" width={160}>
                                        <Menu.Target>
                                            <Tooltip label={t('changeStatus')} withArrow>
                                                <ActionIcon variant="light" size={30} aria-label={t('changeStatus')}>
                                                    <IconAdjustments size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            {ConversationStatusEnum.getOptions(t).map((opt) => (
                                                <Menu.Item
                                                    key={opt.value}
                                                    disabled={c.status === opt.value || updateStatusMutation.isPending}
                                                    onClick={() =>
                                                        updateStatusMutation.mutate({
                                                            id: c.id,
                                                            status: opt.value as ConversationStatusEnum,
                                                        })
                                                    }
                                                >
                                                    {opt.label}
                                                </Menu.Item>
                                            ))}
                                        </Menu.Dropdown>
                                    </Menu>
                                )}
                            </Group>
                        );
                    }}
                />

                {/* Edit message modal */}
                <Modal
                    opened={editModalOpened}
                    onClose={() => setEditModalOpened(false)}
                    title={t('editMessage')}
                    size="md"
                >
                    <Stack gap="sm">
                        <TextInput
                            label={t('text')}
                            required
                            value={editModalText}
                            onChange={(e) => setEditModalText(e.currentTarget.value)}
                        />
                        <Button
                            loading={updateMessageMutation.isPending}
                            disabled={!editModalText.trim() || updateMessageMutation.isPending}
                            onClick={() => {
                                if (editingMessage) {
                                    updateMessageMutation.mutate({
                                        id: editingMessage.id,
                                        text: editModalText.trim(),
                                    });
                                }
                            }}
                        >
                            {t('save')}
                        </Button>
                    </Stack>
                </Modal>

                {/* Send new message modal */}
                <Modal
                    opened={sendModalOpened}
                    onClose={() => setSendModalOpened(false)}
                    title={t('sendMessage')}
                    size="md"
                >
                    <Stack gap="sm">
                        <Select
                            label={t('user')}
                            placeholder={t('selectUser')}
                            data={friendSelectOptions}
                            value={sendModalRecipientId}
                            onChange={setSendModalRecipientId}
                            searchable
                            clearable={false}
                            required
                        />
                        <TextInput
                            label={t('text')}
                            placeholder={t('typeMessage')}
                            required
                            value={sendModalText}
                            onChange={(e) => setSendModalText(e.currentTarget.value)}
                        />
                        <Button
                            loading={sendMutation.isPending}
                            disabled={!sendModalText.trim() || !sendModalRecipientId || sendMutation.isPending}
                            onClick={() => {
                                if (sendModalRecipientId && sendModalText.trim()) {
                                    sendMutation.mutate({
                                        recipientId: sendModalRecipientId,
                                        text: sendModalText.trim(),
                                    });
                                }
                            }}
                            leftSection={<IconSend size={16} />}
                        >
                            {t('send')}
                        </Button>
                    </Stack>
                </Modal>
            </Stack>
        );
    }

    // When viewer != owner: display chat
    return (
        <Stack gap="md">
            <UserProfileNav user={targetUser} isOwner={false} />

            <Group justify="space-between" align="center">
                <Group gap="sm">
                    <Avatar src={formatImageSrc(targetUser?.profilePhoto)} radius="xl">
                        ?
                    </Avatar>
                    <div>
                        <Text size="md" fw={600}>
                            {targetUser?.firstName} {targetUser?.lastName}
                        </Text>
                        <Text size="xs" c="dimmed">
                            @{targetUser?.link}
                        </Text>
                    </div>
                </Group>

                {!canChat && (
                    <Badge color="red" variant="light">
                        {t('mustBeFriendsToChat')}
                    </Badge>
                )}
            </Group>

            {/* Chat messages box */}
            <Card withBorder radius={5} p="md" shadow="xs">
                <ScrollArea h={420} type="always">
                    <Stack gap="xs" p="xs">
                        {conversationsLoading ? (
                            <Text ta="center" c="dimmed">
                                {t('loadingMessages')}
                            </Text>
                        ) : messages.length === 0 ? (
                            <EmptyState title={t('noMessagesSayHello')} />
                        ) : (
                            messages.map((m) => {
                                const isMine = m.senderUserId === currentUser?.id;
                                return (
                                    <Group
                                        key={m.id}
                                        justify={isMine ? 'flex-end' : 'flex-start'}
                                        align="flex-end"
                                        gap="xs"
                                    >
                                        {!isMine && (
                                            <Avatar
                                                src={formatImageSrc(targetUser?.profilePhoto)}
                                                radius="xl"
                                                size="xs"
                                            >
                                                ?
                                            </Avatar>
                                        )}
                                        <Paper
                                            p="xs"
                                            radius="md"
                                            className={isMine ? 'chat-bubble-mine' : 'chat-bubble-other'}
                                            withBorder={!isMine}
                                        >
                                            <Text size="sm">{m.text}</Text>
                                            <Group justify="flex-end" gap={6} mt={2}>
                                                <Text size="10px" className="opacity-70">
                                                    {m.createdAt
                                                        ? new Date(m.createdAt).toLocaleTimeString([], {
                                                              hour: '2-digit',
                                                              minute: '2-digit',
                                                          })
                                                        : ''}
                                                </Text>
                                                {isMine && (
                                                    <Group gap={2}>
                                                        <ActionIcon
                                                            size="xs"
                                                            variant="subtle"
                                                            onClick={() => {
                                                                setEditingMessage(m);
                                                                setEditModalText(m.text);
                                                                setEditModalOpened(true);
                                                            }}
                                                            aria-label={t('edit')}
                                                        >
                                                            <IconEdit size={12} />
                                                        </ActionIcon>
                                                        <ActionIcon
                                                            size="xs"
                                                            variant="subtle"
                                                            color="red"
                                                            onClick={() => handleDeleteMessage(m.id)}
                                                            aria-label={t('delete')}
                                                        >
                                                            <IconTrash size={12} />
                                                        </ActionIcon>
                                                    </Group>
                                                )}
                                            </Group>
                                        </Paper>
                                    </Group>
                                );
                            })
                        )}
                        <div ref={chatEndRef} />
                    </Stack>
                </ScrollArea>

                {/* Input box */}
                <form onSubmit={handleSendChat}>
                    <Group gap="xs" mt="sm">
                        <TextInput
                            aria-label={canChat ? t('typeMessage') : t('mustBeFriendsToChat')}
                            placeholder={canChat ? t('typeMessage') : t('mustBeFriendsToChat')}
                            disabled={!canChat || sendMutation.isPending}
                            value={messageInput}
                            onChange={(e) => {
                                setMessageInput(e.currentTarget.value);
                                if (targetUser?.id) {
                                    conversationService.touchActivityUpdatedAt(targetUser.id).catch(() => {});
                                }
                            }}
                            flex={1}
                        />
                        <Button
                            type="submit"
                            disabled={sendMutation.isPending || !canChat || !messageInput.trim()}
                            loading={sendMutation.isPending}
                            leftSection={<IconSend size={16} />}
                        >
                            {t('send')}
                        </Button>
                    </Group>
                </form>
            </Card>

            {/* Edit message modal */}
            <Modal
                opened={editModalOpened}
                onClose={() => setEditModalOpened(false)}
                title={t('editMessage')}
                size="md"
            >
                <Stack gap="sm">
                    <TextInput
                        label={t('text')}
                        required
                        value={editModalText}
                        onChange={(e) => setEditModalText(e.currentTarget.value)}
                    />
                    <Button
                        loading={updateMessageMutation.isPending}
                        disabled={!editModalText.trim() || updateMessageMutation.isPending}
                        onClick={() => {
                            if (editingMessage) {
                                updateMessageMutation.mutate({
                                    id: editingMessage.id,
                                    text: editModalText.trim(),
                                });
                            }
                        }}
                    >
                        {t('save')}
                    </Button>
                </Stack>
            </Modal>
        </Stack>
    );
}
