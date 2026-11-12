import { useState, useRef, useEffect, useCallback, type SyntheticEvent } from 'react';
import {
    Text,
    Group,
    TextInput,
    Button,
    Stack,
    Badge,
    Center,
    Loader,
    Select,
    Card,
    Paper,
    ScrollArea,
} from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { conversationService, type ConversationResource } from '../../api/services';
import { useAuth } from '../../auth';
import { ConversationStatusEnum } from '../../enums/ConversationStatusEnum';
import { EntryTypeEnum } from '../../enums/EntryTypeEnum';
import {
    DataTable,
    type Column,
    EmptyState,
    EntityViewCounter,
    UserSubpageContainer,
    StatusBadge,
    StatusActionMenu,
    ViewActionButton,
    EditActionButton,
    DeleteActionButton,
    UserInfoCell,
} from '../../components';
import { confirmDelete, formatDateTime, formatClockTime, truncate, notifySuccess, notifyError } from '../../utils';
import { useDataTableState, useMyFriends, useFormErrors, useConversationData } from '../../hooks';
import { InteractionModal as Modal } from '../../components/common/InteractionModal';

export default function UserConversations() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();
    const chatEndRef = useRef<HTMLDivElement>(null);

    const tableState = useDataTableState({ initialSort: 'createdAt:desc' });

    const editErrors = useFormErrors();
    const sendErrors = useFormErrors();
    const chatErrors = useFormErrors();

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
                const conversationData = useConversationData({
                    targetUser,
                    isOwner,
                    page: tableState.page,
                    limit: tableState.limit,
                    sort: tableState.sort,
                    statusFilter,
                });
                const {
                    canChat,
                    conversationsResponse,
                    conversationsLoading,
                    fetchNextChatPage,
                    hasMoreChatMessages,
                    isFetchingMoreChatMessages,
                    chatLoading,
                    messages,
                    getUser,
                    isPartnerTyping,
                    recordActivity,
                    resetActivityThrottle,
                } = conversationData;
                const { collaboratorOptions } = useMyFriends();

                const chatViewportRef = useRef<HTMLDivElement>(null);
                const prevScrollHeightRef = useRef<number>(0);
                const isPrependingRef = useRef<boolean>(false);
                const hasInitialScrolledRef = useRef(false);

                useEffect(() => {
                    if (!isOwner && !hasInitialScrolledRef.current && messages.length > 0) {
                        chatEndRef.current?.scrollIntoView({ behavior: 'instant' });
                        hasInitialScrolledRef.current = true;
                    }
                }, [isOwner, messages.length]);

                const handleChatScroll = useCallback(
                    ({ y }: { y: number }) => {
                        if (!hasInitialScrolledRef.current) return;
                        if (y <= 30 && hasMoreChatMessages && !isFetchingMoreChatMessages) {
                            if (chatViewportRef.current) {
                                prevScrollHeightRef.current = chatViewportRef.current.scrollHeight;
                                isPrependingRef.current = true;
                            }
                            void fetchNextChatPage();
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
                }, [messages.length]);

                useEffect(() => {
                    if (!isOwner && isPartnerTyping) {
                        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }
                }, [isOwner, isPartnerTyping]);

                const handleInputChange = (val: string) => {
                    setMessageInput(val);
                    recordActivity();
                };

                const sendMutation = useMutation({
                    mutationFn: ({ recipientId, text }: { recipientId: string; text: string }) =>
                        conversationService.createConversation({
                            params: { path: { id: recipientId } },
                            body: { text },
                        }),
                    onSuccess: () => {
                        setMessageInput('');
                        resetActivityThrottle();
                        setSendModalText('');
                        setSendModalOpened(false);
                        sendErrors.clearErrors();
                        chatErrors.clearErrors();
                        void queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
                        void queryClient.invalidateQueries({ queryKey: ['conversations-data'] });
                        setTimeout(() => {
                            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }, 50);
                        notifySuccess(t('saved'), t('conversations'));
                    },
                    onError: (err) => {
                        sendErrors.setFromError(err);
                        chatErrors.setFromError(err);
                    },
                });

                const updateMessageMutation = useMutation({
                    mutationFn: ({ id, text }: { id: string; text: string }) =>
                        conversationService.updateConversation({
                            params: { path: { id } },
                            body: { text },
                        }),
                    onSuccess: () => {
                        void queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
                        void queryClient.invalidateQueries({ queryKey: ['conversations-data'] });
                        notifySuccess(t('saved'), t('conversations'));
                        setEditModalOpened(false);
                        setEditingMessage(null);
                        editErrors.clearErrors();
                    },
                    onError: (err) => editErrors.setFromError(err),
                });

                const updateStatusMutation = useMutation({
                    mutationFn: ({ id, status }: { id: string; status: ConversationStatusEnum }) =>
                        conversationService.updateConversationStatus({
                            params: { path: { id } },
                            body: { status },
                        }),
                    onSuccess: () => {
                        void queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
                        void queryClient.invalidateQueries({ queryKey: ['conversations-data'] });
                        notifySuccess(t('statusUpdated'), t('conversations'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

                const deleteMessageMutation = useMutation({
                    mutationFn: (id: string) =>
                        conversationService.deleteConversation({
                            params: { path: { id } },
                        }),
                    onSuccess: () => {
                        void queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
                        void queryClient.invalidateQueries({ queryKey: ['conversations-data'] });
                        notifySuccess(t('deleted'), t('conversations'));
                    },
                    onError: (err) => notifyError(err, t('error')),
                });

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
                    <Modal
                        opened={editModalOpened}
                        onClose={() => {
                            setEditModalOpened(false);
                            editErrors.clearErrors();
                        }}
                        title={t('editMessage')}
                    >
                        <Stack gap="sm">
                            <TextInput
                                label={t('text')}
                                required
                                value={editModalText}
                                error={editErrors.errors.text}
                                onChange={(e) => {
                                    setEditModalText(e.currentTarget.value);
                                    editErrors.clearFieldError('text');
                                }}
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
                        <Stack>
                            <DataTable
                                columns={conversationColumns}
                                data={messages}
                                isLoading={conversationsLoading}
                                totalItems={conversationsResponse?.pagination?.total ?? messages.length}
                                state={tableState}
                                filtersNode={
                                    <Group grow align="flex-start" gap="sm">
                                        <Select
                                            label={t('status')}
                                            placeholder={t('allStatuses')}
                                            data={statusSelectOptions}
                                            value={statusFilter ? String(statusFilter) : ''}
                                            onChange={(val) => {
                                                setStatusFilter(val ? Number(val) : null);
                                                tableState.resetPage();
                                            }}
                                            clearable
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
                                                        editErrors.clearErrors();
                                                        setEditingMessage(c);
                                                        setEditModalText(c.text);
                                                        setEditModalOpened(true);
                                                    }}
                                                />
                                            )}
                                            {isSender && (
                                                <DeleteActionButton
                                                    onClick={() =>
                                                        confirmDelete(t, () => deleteMessageMutation.mutate(c.id))
                                                    }
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
                                                            status: status,
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
                                onClose={() => {
                                    setSendModalOpened(false);
                                    sendErrors.clearErrors();
                                }}
                                title={t('sendMessage')}
                            >
                                <Stack gap="sm">
                                    <Select
                                        label={t('user')}
                                        placeholder={t('selectUser')}
                                        data={collaboratorOptions}
                                        value={sendModalRecipientId}
                                        error={
                                            sendErrors.errors.recipientId ||
                                            sendErrors.errors.user ||
                                            sendErrors.errors.userId ||
                                            sendErrors.errors.receiverUserId
                                        }
                                        onChange={(val) => {
                                            setSendModalRecipientId(val);
                                            sendErrors.clearFieldError('recipientId');
                                            sendErrors.clearFieldError('user');
                                        }}
                                        searchable
                                        clearable={false}
                                        required
                                    />
                                    <TextInput
                                        label={t('text')}
                                        placeholder={t('typeMessage')}
                                        required
                                        value={sendModalText}
                                        error={sendErrors.errors.text}
                                        onChange={(e) => {
                                            setSendModalText(e.currentTarget.value);
                                            sendErrors.clearFieldError('text');
                                        }}
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
                    <Stack>
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
                                                variant="default"
                                                onClick={() => {
                                                    if (chatViewportRef.current) {
                                                        prevScrollHeightRef.current =
                                                            chatViewportRef.current.scrollHeight;
                                                        isPrependingRef.current = true;
                                                    }
                                                    void fetchNextChatPage();
                                                }}
                                                loading={isFetchingMoreChatMessages}
                                            >
                                                {t('loadEarlier')}
                                            </Button>
                                        </Center>
                                    )}

                                    {chatLoading ? (
                                        <Text ta="center" c="dimmed">
                                            {t('loading')}
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
                                                                    {formatClockTime(m.createdAt)}
                                                                </Text>
                                                                {isMine && (
                                                                    <Group gap="xs">
                                                                        <EditActionButton
                                                                            onClick={() => {
                                                                                setEditingMessage(m);
                                                                                setEditModalText(m.text);
                                                                                setEditModalOpened(true);
                                                                            }}
                                                                        />
                                                                        <DeleteActionButton
                                                                            onClick={() =>
                                                                                confirmDelete(t, () =>
                                                                                    deleteMessageMutation.mutate(m.id),
                                                                                )
                                                                            }
                                                                        />
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
                                            <Paper p="xs" className="chat-bubble-other">
                                                <Group gap="xs" align="center">
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
                                        error={chatErrors.errors.text}
                                        onChange={(e) => {
                                            handleInputChange(e.currentTarget.value);
                                            chatErrors.clearFieldError('text');
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

                        {editModalNode}
                    </Stack>
                );
            }}
        </UserSubpageContainer>
    );
}
