import { useState, useMemo, useRef, useEffect, useCallback, type SyntheticEvent } from 'react';
import {
    Text,
    Group,
    TextInput,
    Button,
    Stack,
    Avatar,
    Badge,
    ActionIcon,
    Center,
    Loader,
    Select,
    Modal,
    Card,
    Paper,
    ScrollArea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSend, IconTrash, IconEdit } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../../components/EmptyState';
import { getErrorMessage } from '../../api/client';
import { conversationService, friendService, type ConversationResource } from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column } from '../../components/DataTable';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { ConversationStatusEnum } from '../../enums/ConversationStatusEnum';
import { EntryTypeEnum } from '../../enums/EntryTypeEnum';
import { EntityViewCounter } from '../../components/EntityViewCounter';
import { formatImageSrc } from '../../utils/imageUtils';
import { openConfirmActionModal } from '../../utils/confirmModal';
import { formatDateTime, formatTime } from '../../utils/date';
import { truncate } from '../../utils/text';
import { UserSubpageContainer } from '../../components/common/UserSubpageContainer';
import { useDataTableState } from '../../hooks/useDataTableState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatusActionMenu } from '../../components/common/StatusActionMenu';
import { ViewActionButton, EditActionButton, DeleteActionButton } from '../../components/common/RowActionButtons';
import { useUsersMap } from '../../hooks/useUsersMap';
import { useMyFriends } from '../../hooks/useMyFriends';
import { UserInfoCell } from '../../components/common/UserInfoCell';

export default function UserConversations() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();
    const chatEndRef = useRef<HTMLDivElement>(null);

    const tableState = useDataTableState({
        defaultSort: 'createdAt:desc',
    });

    const [messageInput, setMessageInput] = useState('');
    const [statusFilter, setStatusFilter] = useState<number | null>(null);

    const [editModalOpened, setEditModalOpened] = useState(false);
    const [editingMessage, setEditingMessage] = useState<ConversationResource | null>(null);
    const [editModalText, setEditModalText] = useState('');

    const [sendModalOpened, setSendModalOpened] = useState(false);
    const [sendModalRecipientId, setSendModalRecipientId] = useState<string | null>(null);
    const [sendModalText, setSendModalText] = useState('');

    return (
        <UserSubpageContainer>
            {({ targetUser, isOwner }) => {
                const { data: friendship } = useQuery({
                    queryKey: ['friendship', currentUser?.id, targetUser.id],
                    queryFn: async () => {
                        if (!currentUser || isOwner) return null;
                        const res = await friendService.getFriends({
                            params: {
                                query: {
                                    filter: { userIds: [targetUser.id] },
                                    limit: 10,
                                },
                            },
                        });
                        return (
                            res.data?.find(
                                (f) =>
                                    (f.senderUserId === targetUser.id && f.receiverUserId === currentUser.id) ||
                                    (f.senderUserId === currentUser.id && f.receiverUserId === targetUser.id),
                            ) ?? null
                        );
                    },
                    enabled: !!currentUser && !isOwner,
                });

                const canChat = !isOwner && friendship?.status === FriendStatusEnum.ACCEPTED;

                const { collaboratorOptions } = useMyFriends();

                const { data: conversationsResponse, isLoading: conversationsLoading } = useQuery({
                    queryKey: [
                        'conversations-data',
                        currentUser?.id,
                        targetUser.id,
                        tableState.page,
                        tableState.limit,
                        tableState.sort,
                        statusFilter,
                    ],
                    queryFn: async () => {
                        if (!currentUser || !isOwner) return { data: [], pagination: null };
                        return await conversationService.getConversations({
                            params: {
                                query: {
                                    page: tableState.page,
                                    limit: tableState.limit,
                                    sort: tableState.sort as any,
                                    filter: {
                                        ...(statusFilter ? { status: statusFilter as any } : {}),
                                    },
                                },
                            },
                        });
                    },
                    enabled: isOwner && !!currentUser,
                    refetchInterval: 10000,
                });

                const {
                    data: chatInfiniteData,
                    isLoading: chatLoading,
                    fetchNextPage: fetchNextChatPage,
                    hasNextPage: hasMoreChatMessages,
                    isFetchingNextPage: isFetchingMoreChatMessages,
                } = useInfiniteQuery({
                    queryKey: ['chat-messages', currentUser?.id, targetUser.id],
                    queryFn: async ({ pageParam = 1 }) => {
                        if (!currentUser) return { data: [], pagination: {} };
                        return await conversationService.getConversations({
                            params: {
                                query: {
                                    page: pageParam,
                                    limit: 10,
                                    sort: 'createdAt:desc',
                                    filter: {
                                        userId: targetUser.id,
                                    },
                                },
                            },
                        });
                    },
                    initialPageParam: 1,
                    getNextPageParam: (lastPage) => {
                        const p = lastPage.pagination;
                        if (p?.hasNextPage && p?.page) {
                            return p.page + 1;
                        }
                        return undefined;
                    },
                    enabled: !isOwner && !!currentUser,
                    refetchInterval: 3000,
                });

                const chatMessages = useMemo(() => {
                    if (isOwner) return [];
                    const msgs = chatInfiniteData?.pages.flatMap((page) => page.data ?? []) ?? [];
                    return [...msgs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                }, [isOwner, chatInfiniteData]);

                const chatViewportRef = useRef<HTMLDivElement>(null);
                const prevScrollHeightRef = useRef<number>(0);
                const isPrependingRef = useRef<boolean>(false);
                const hasInitialScrolledRef = useRef(false);

                useEffect(() => {
                    if (!isOwner && !hasInitialScrolledRef.current && chatMessages.length > 0) {
                        chatEndRef.current?.scrollIntoView({ behavior: 'instant' });
                        hasInitialScrolledRef.current = true;
                    }
                }, [isOwner, chatMessages.length]);

                const handleChatScroll = useCallback(
                    ({ y }: { y: number }) => {
                        if (!hasInitialScrolledRef.current) return;
                        if (y <= 30 && hasMoreChatMessages && !isFetchingMoreChatMessages) {
                            if (chatViewportRef.current) {
                                prevScrollHeightRef.current = chatViewportRef.current.scrollHeight;
                                isPrependingRef.current = true;
                            }
                            fetchNextChatPage();
                        }
                    },
                    [hasMoreChatMessages, isFetchingMoreChatMessages, fetchNextChatPage],
                );

                useEffect(() => {
                    if (isPrependingRef.current && chatViewportRef.current) {
                        const newScrollHeight = chatViewportRef.current.scrollHeight;
                        chatViewportRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
                        isPrependingRef.current = false;
                    }
                }, [chatMessages.length]);

                const userIdsToFetch = useMemo(() => {
                    if (!isOwner) return [];
                    const set = new Set<string>();
                    conversationsResponse?.data?.forEach((c) => {
                        if (c.senderUserId) set.add(c.senderUserId);
                        if (c.receiverUserId) set.add(c.receiverUserId);
                    });
                    return Array.from(set);
                }, [isOwner, conversationsResponse?.data]);

                const { getUser } = useUsersMap(userIdsToFetch);
                const messages = isOwner ? (conversationsResponse?.data ?? []) : chatMessages;

                const { data: activitiesData } = useQuery({
                    queryKey: ['conversation-activities', currentUser?.id, targetUser.id],
                    queryFn: async () => {
                        if (!currentUser || isOwner) return [];
                        const res = await conversationService.getConversationActivities({
                            params: {
                                query: {
                                    filter: { userId: targetUser.id },
                                    limit: 10,
                                    sort: 'updatedAt:desc',
                                },
                            },
                        });
                        return res.data ?? [];
                    },
                    enabled: !isOwner && !!currentUser && canChat,
                    refetchInterval: 5000,
                });

                const isPartnerTyping = useMemo(() => {
                    if (!activitiesData || activitiesData.length === 0 || !currentUser?.id) {
                        return false;
                    }
                    const partnerActivity = activitiesData.find(
                        (a) => a.senderUserId === targetUser.id && a.receiverUserId === currentUser.id,
                    );
                    if (!partnerActivity) return false;
                    if (partnerActivity.isWriting) return true;
                    const diffMs = Date.now() - new Date(partnerActivity.updatedAt).getTime();
                    return diffMs <= 6000;
                }, [activitiesData, targetUser.id, currentUser?.id]);

                const lastIncomingMessage = useMemo(() => {
                    if (isOwner || !messages || messages.length === 0) return null;
                    for (let i = messages.length - 1; i >= 0; i--) {
                        if (messages[i].senderUserId === targetUser.id) {
                            return messages[i];
                        }
                    }
                    return null;
                }, [isOwner, messages, targetUser.id]);

                const markedReadMsgIdRef = useRef<string | null>(null);

                useEffect(() => {
                    markedReadMsgIdRef.current = null;
                }, [targetUser.id]);

                useEffect(() => {
                    if (
                        !isOwner &&
                        lastIncomingMessage &&
                        lastIncomingMessage.status !== ConversationStatusEnum.READ &&
                        markedReadMsgIdRef.current !== lastIncomingMessage.id
                    ) {
                        markedReadMsgIdRef.current = lastIncomingMessage.id;
                        conversationService
                            .updateConversationStatus({
                                params: { path: { id: lastIncomingMessage.id } },
                                body: { status: ConversationStatusEnum.READ },
                            })
                            .then(() => {
                                queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
                            })
                            .catch(() => {});
                    }
                }, [isOwner, lastIncomingMessage, queryClient]);

                useEffect(() => {
                    if (!isOwner && isPartnerTyping) {
                        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }
                }, [isOwner, isPartnerTyping]);

                const lastActivitySentRef = useRef<number>(0);

                const handleInputChange = (val: string) => {
                    setMessageInput(val);
                    if (isOwner) return;

                    const now = Date.now();
                    if (now - lastActivitySentRef.current >= 4500) {
                        lastActivitySentRef.current = now;
                        conversationService
                            .updateConversationActivityUpdatedAt({
                                params: { path: { id: targetUser.id } },
                            })
                            .catch(() => {});
                    }
                };

                const sendMutation = useMutation({
                    mutationFn: async ({ recipientId, text }: { recipientId: string; text: string }) => {
                        await conversationService.createConversation({
                            params: { path: { id: recipientId } },
                            body: { text },
                        });
                    },
                    onSuccess: () => {
                        setMessageInput('');
                        lastActivitySentRef.current = 0;
                        setSendModalText('');
                        setSendModalOpened(false);
                        queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
                        queryClient.invalidateQueries({ queryKey: ['conversations-data'] });
                        setTimeout(() => {
                            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }, 50);
                        notifications.show({
                            title: t('conversations'),
                            message: t('messageSent'),
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

                const updateMessageMutation = useMutation({
                    mutationFn: ({ id, text }: { id: string; text: string }) =>
                        conversationService.updateConversation({
                            params: { path: { id } },
                            body: { text },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
                        queryClient.invalidateQueries({ queryKey: ['conversations-data'] });
                        notifications.show({
                            title: t('conversations'),
                            message: t('messageUpdated'),
                            color: 'green',
                        });
                        setEditModalOpened(false);
                        setEditingMessage(null);
                    },
                    onError: (err) => {
                        notifications.show({
                            title: t('error'),
                            message: getErrorMessage(err),
                            color: 'red',
                        });
                    },
                });

                const updateStatusMutation = useMutation({
                    mutationFn: ({ id, status }: { id: string; status: ConversationStatusEnum }) =>
                        conversationService.updateConversationStatus({
                            params: { path: { id } },
                            body: { status },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
                        queryClient.invalidateQueries({ queryKey: ['conversations-data'] });
                        notifications.show({
                            title: t('conversations'),
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

                const deleteMessageMutation = useMutation({
                    mutationFn: (id: string) =>
                        conversationService.deleteConversation({
                            params: { path: { id } },
                        }),
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
                        queryClient.invalidateQueries({ queryKey: ['conversations-data'] });
                        notifications.show({
                            title: t('conversations'),
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
                    if (!messageInput.trim() || !canChat || sendMutation.isPending) return;
                    sendMutation.mutate({ recipientId: targetUser.id, text: messageInput.trim() });
                };

                const conversationColumns: Column<ConversationResource>[] = [
                    {
                        key: 'user',
                        header: t('user'),
                        render: (c) => {
                            const otherId = c.senderUserId === currentUser?.id ? c.receiverUserId : c.senderUserId;
                            return <UserInfoCell user={getUser(otherId)} userId={otherId} />;
                        },
                    },
                    {
                        key: 'text',
                        header: t('text'),
                        render: (c) => (
                            <Text size="sm" title={c.text}>
                                {truncate(c.text, 50)}
                            </Text>
                        ),
                    },
                    {
                        key: 'status',
                        header: t('status'),
                        render: (c) => <StatusBadge status={c.status} enumType={ConversationStatusEnum} />,
                    },
                    {
                        key: 'createdAt',
                        header: t('createdAt'),
                        render: (c) => (
                            <Text size="sm" c="dimmed">
                                {formatDateTime(c.createdAt)}
                            </Text>
                        ),
                    },
                ];

                const statusSelectOptions = [
                    { value: '', label: t('allStatuses') },
                    ...ConversationStatusEnum.getOptions(t).map((opt) => ({
                        value: String(opt.value),
                        label: opt.label,
                    })),
                ];

                const editModalNode = (
                    <Modal opened={editModalOpened} onClose={() => setEditModalOpened(false)} title={t('edit')}>
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
                );

                if (isOwner) {
                    return (
                        <Stack gap="md">
                            <DataTable
                                columns={conversationColumns}
                                data={messages}
                                isLoading={conversationsLoading}
                                totalItems={conversationsResponse?.pagination?.total ?? messages.length}
                                state={tableState}
                                filtersNode={
                                    <Group gap="sm">
                                        <Select
                                            placeholder={t('allStatuses')}
                                            data={statusSelectOptions}
                                            value={statusFilter ? String(statusFilter) : ''}
                                            onChange={(val) => {
                                                setStatusFilter(val ? Number(val) : null);
                                                tableState.resetPage();
                                            }}
                                            clearable
                                            w={180}
                                        />
                                    </Group>
                                }
                                activeFiltersCount={statusFilter !== null ? 1 : 0}
                                onResetFilters={() => {
                                    setStatusFilter(null);
                                    tableState.resetPage();
                                }}
                                onAdd={() => {
                                    setSendModalRecipientId(collaboratorOptions[0]?.value || null);
                                    setSendModalText('');
                                    setSendModalOpened(true);
                                }}
                                addLabel={t('sendMessage')}
                                actions={(c) => {
                                    const isSender = c.senderUserId === currentUser?.id;
                                    const isReceiver = c.receiverUserId === currentUser?.id;
                                    const otherId = isSender ? c.receiverUserId : c.senderUserId;
                                    const other = getUser(otherId);

                                    return (
                                        <Group gap="xs" justify="flex-end" wrap="nowrap">
                                            <ViewActionButton to={`/users/${other?.link ?? otherId}/conversations`} />
                                            {isSender && (
                                                <EditActionButton
                                                    onClick={() => {
                                                        setEditingMessage(c);
                                                        setEditModalText(c.text);
                                                        setEditModalOpened(true);
                                                    }}
                                                />
                                            )}
                                            {isSender && (
                                                <DeleteActionButton
                                                    onClick={() => handleDeleteMessage(c.id)}
                                                    loading={deleteMessageMutation.isPending}
                                                />
                                            )}
                                            {isReceiver && (
                                                <StatusActionMenu
                                                    value={c.status}
                                                    enumType={ConversationStatusEnum}
                                                    onChange={(status) =>
                                                        updateStatusMutation.mutate({
                                                            id: c.id,
                                                            status: status as ConversationStatusEnum,
                                                        })
                                                    }
                                                    loading={updateStatusMutation.isPending}
                                                />
                                            )}
                                        </Group>
                                    );
                                }}
                            />

                            {editModalNode}

                            <Modal
                                opened={sendModalOpened}
                                onClose={() => setSendModalOpened(false)}
                                title={t('sendMessage')}
                            >
                                <Stack gap="sm">
                                    <Select
                                        label={t('user')}
                                        placeholder={t('selectUser')}
                                        data={collaboratorOptions}
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
                                        disabled={
                                            !sendModalText.trim() || !sendModalRecipientId || sendMutation.isPending
                                        }
                                        onClick={() => {
                                            if (sendModalRecipientId && sendModalText.trim()) {
                                                sendMutation.mutate({
                                                    recipientId: sendModalRecipientId,
                                                    text: sendModalText.trim(),
                                                });
                                            }
                                        }}
                                    >
                                        {t('send')}
                                    </Button>
                                </Stack>
                            </Modal>
                        </Stack>
                    );
                }

                return (
                    <Stack gap="md">
                        {!canChat && (
                            <Group justify="flex-end">
                                <Badge color="red">{t('mustBeFriendsToChat')}</Badge>
                            </Group>
                        )}

                        <Card>
                            <ScrollArea
                                h={420}
                                type="always"
                                viewportRef={chatViewportRef}
                                onScrollPositionChange={handleChatScroll}
                            >
                                <Stack gap="xs" p="xs">
                                    {hasMoreChatMessages && (
                                        <Center my="xs">
                                            <Button
                                                size="xs"
                                                variant="subtle"
                                                onClick={() => {
                                                    if (chatViewportRef.current) {
                                                        prevScrollHeightRef.current =
                                                            chatViewportRef.current.scrollHeight;
                                                        isPrependingRef.current = true;
                                                    }
                                                    fetchNextChatPage();
                                                }}
                                                loading={isFetchingMoreChatMessages}
                                            >
                                                {t('loadEarlier')}
                                            </Button>
                                        </Center>
                                    )}

                                    {chatLoading ? (
                                        <Text ta="center" c="dimmed">
                                            {t('loadingMessages')}
                                        </Text>
                                    ) : messages.length === 0 ? (
                                        <EmptyState title={t('noMessagesSayHello')} />
                                    ) : (
                                        messages.map((m, idx) => {
                                            const isMine = m.senderUserId === currentUser?.id;
                                            const isLastMessage = idx === messages.length - 1;

                                            return (
                                                <Stack key={m.id} gap={2} align={isMine ? 'flex-end' : 'flex-start'}>
                                                    <Group
                                                        justify={isMine ? 'flex-end' : 'flex-start'}
                                                        align="flex-end"
                                                        gap="xs"
                                                    >
                                                        {!isMine && (
                                                            <Avatar
                                                                src={formatImageSrc(targetUser.profilePhoto)}
                                                                size="xs"
                                                            >
                                                                ?
                                                            </Avatar>
                                                        )}
                                                        <Paper
                                                            p="xs"
                                                            className={
                                                                isMine ? 'chat-bubble-mine' : 'chat-bubble-other'
                                                            }
                                                        >
                                                            <Text size="sm">{m.text}</Text>
                                                            <Group justify="flex-end" gap={6} mt={2}>
                                                                <EntityViewCounter
                                                                    entityId={m.id}
                                                                    type={EntryTypeEnum.CONVERSATION}
                                                                    size={12}
                                                                    textSize="xs"
                                                                    track={true}
                                                                    opacity={0.7}
                                                                />
                                                                <Text size="xs" opacity={0.7}>
                                                                    {formatTime(m.createdAt)}
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
                                                    {isLastMessage && (
                                                        <Group
                                                            justify={isMine ? 'flex-end' : 'flex-start'}
                                                            mt={2}
                                                            mb="xs"
                                                        >
                                                            <Badge
                                                                size="xs"
                                                                variant="light"
                                                                color={
                                                                    m.status === ConversationStatusEnum.READ
                                                                        ? 'green'
                                                                        : 'gray'
                                                                }
                                                            >
                                                                {m.status === ConversationStatusEnum.READ
                                                                    ? t('conversationStatuses.read')
                                                                    : t('conversationStatuses.sent')}
                                                            </Badge>
                                                        </Group>
                                                    )}
                                                </Stack>
                                            );
                                        })
                                    )}
                                    {isPartnerTyping && (
                                        <Group gap="xs" align="center" mt="xs">
                                            <Avatar src={formatImageSrc(targetUser.profilePhoto)} size="xs">
                                                ?
                                            </Avatar>
                                            <Paper p="xs" className="chat-bubble-other">
                                                <Group gap={6} align="center">
                                                    <Loader size={12} type="dots" />
                                                    <Text size="xs" c="dimmed" fs="italic">
                                                        {targetUser.firstName} {t('isTyping')}...
                                                    </Text>
                                                </Group>
                                            </Paper>
                                        </Group>
                                    )}
                                    <div ref={chatEndRef} />
                                </Stack>
                            </ScrollArea>

                            <form onSubmit={handleSendChat}>
                                <Group gap="xs" mt="sm">
                                    <TextInput
                                        aria-label={canChat ? t('typeMessage') : t('mustBeFriendsToChat')}
                                        placeholder={canChat ? t('typeMessage') : t('mustBeFriendsToChat')}
                                        disabled={!canChat || sendMutation.isPending}
                                        value={messageInput}
                                        onChange={(e) => handleInputChange(e.currentTarget.value)}
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

                        {editModalNode}
                    </Stack>
                );
            }}
        </UserSubpageContainer>
    );
}
