import { useState, useEffect, useRef, useMemo, type SyntheticEvent } from 'react';
import { Card, Title, Text, Group, TextInput, Button, Stack, Avatar, Paper, ScrollArea, Badge } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSend, IconMessage } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { getErrorMessage } from '../../api/client';
import {
    conversationService,
    userService,
    friendService,
    type UserResource,
    type ConversationActivityResource,
    type GetConversationActivitiesQuery,
} from '../../api/services';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, type Column, type SortOption } from '../../components/DataTable';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { UserProfileNav } from '../../components/UserProfileNav';
import { formatImageSrc } from '../../utils/imageUtils';

export default function UserConversations() {
    const { link } = useParams<{ link: string }>();
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    const [messageInput, setMessageInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Pagination & sort for conversations list
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState<string | null>('updatedAt:desc');

    // Target user
    const { data: targetUser } = useQuery({
        queryKey: ['user', link],
        queryFn: async () => {
            if (!link) return null;
            return await userService.getUserByLink(link);
        },
        enabled: !!link,
    });

    const isMyProfile = currentUser?.id === targetUser?.id;

    // Check friendship
    const { data: friendship } = useQuery({
        queryKey: ['friendship', currentUser?.id, targetUser?.id],
        queryFn: async () => {
            if (!currentUser || !targetUser || isMyProfile) return null;
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
        enabled: !!currentUser && !!targetUser && !isMyProfile,
    });

    const canChat = isMyProfile || friendship?.status === FriendStatusEnum.ACCEPTED;

    const sortOptions: SortOption[] = [
        { value: 'updatedAt:desc', label: t('sort_updatedAt_desc') },
        { value: 'updatedAt:asc', label: t('sort_updatedAt_asc') },
        { value: 'createdAt:desc', label: t('sort_createdAt_desc') },
        { value: 'createdAt:asc', label: t('sort_createdAt_asc') },
    ];

    // Fetch conversation activities (if my profile)
    const { data: activities, isLoading: activitiesLoading } = useQuery({
        queryKey: ['conversation-activities', page, limit, sort],
        queryFn: async () => {
            return await conversationService.getActivities({
                page,
                limit,
                sort: (sort as NonNullable<GetConversationActivitiesQuery>['sort']) ?? 'updatedAt:desc',
            });
        },
        enabled: isMyProfile,
    });

    const activityUserIds = useMemo(() => {
        if (!currentUser || !activities) return [];
        return Array.from(
            new Set(activities.map((a) => (a.senderUserId === currentUser.id ? a.receiverUserId : a.senderUserId))),
        );
    }, [activities, currentUser]);

    const { data: relatedUsersData } = useQuery({
        queryKey: ['act-users', activityUserIds],
        queryFn: async () => {
            if (activityUserIds.length === 0) return {};
            const users = await userService.getUsersByIds(activityUserIds);
            const map: Record<string, UserResource> = {};
            users.forEach((u) => {
                map[u.id] = u;
            });
            return map;
        },
        enabled: activityUserIds.length > 0,
    });

    const relatedUsers = relatedUsersData ?? {};

    // Fetch messages (if target user)
    const { data: messages, isLoading: messagesLoading } = useQuery({
        queryKey: ['conversations', currentUser?.id, targetUser?.id],
        queryFn: async () => {
            if (!currentUser || !targetUser || isMyProfile) return [];
            return await conversationService.getMessages(targetUser.id);
        },
        enabled: !!currentUser && !!targetUser && !isMyProfile,
        refetchInterval: 5000,
    });

    // Auto-scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send message mutation
    const sendMutation = useMutation({
        mutationFn: async (text: string) => {
            if (!targetUser?.id) return;
            await conversationService.sendMessage(targetUser.id, text);
        },
        onSuccess: () => {
            setMessageInput('');
            queryClient.invalidateQueries({
                queryKey: ['conversations', currentUser?.id, targetUser?.id],
            });
        },
        onError: (err) => {
            notifications.show({ title: t('error'), message: getErrorMessage(err), color: 'red' });
        },
    });

    const handleSend = (e: SyntheticEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !canChat) return;
        sendMutation.mutate(messageInput.trim());
    };

    const activityColumns: Column<ConversationActivityResource>[] = [
        {
            key: 'user',
            header: t('user'),
            render: (act) => {
                const otherId = act.senderUserId === currentUser?.id ? act.receiverUserId : act.senderUserId;
                const other = relatedUsers[otherId];
                return (
                    <Group gap="sm">
                        <Avatar src={formatImageSrc(other?.profilePhoto)} radius="xl">
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
            key: 'updatedAt',
            header: t('createdAt'),
            render: (act) => (
                <Text size="xs" c="dimmed">
                    {act.updatedAt ? new Date(act.updatedAt).toLocaleString() : '-'}
                </Text>
            ),
        },
    ];

    // If looking at own profile without target user -> show recent conversations list with full DataTable
    if (isMyProfile) {
        return (
            <Stack gap="md">
                <UserProfileNav user={currentUser} isOwner={true} />
                <Title order={3}>{t('conversations')}</Title>
                <DataTable
                    columns={activityColumns}
                    data={activities ?? []}
                    isLoading={activitiesLoading}
                    page={page}
                    totalItems={activities?.length}
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
                    actions={(act) => {
                        const otherId = act.senderUserId === currentUser?.id ? act.receiverUserId : act.senderUserId;
                        const other = relatedUsers[otherId];
                        return (
                            <Button
                                component={Link}
                                to={`/users/${other?.link ?? otherId}/conversations`}
                                variant="light"
                                size="xs"
                                leftSection={<IconMessage size={14} />}
                            >
                                {t('chat')}
                            </Button>
                        );
                    }}
                />
            </Stack>
        );
    }

    return (
        <Stack gap="md">
            {targetUser && <UserProfileNav user={targetUser} isOwner={isMyProfile} />}
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
            <Card withBorder radius="md" p="md" shadow="xs">
                <ScrollArea h={420} type="always">
                    <Stack gap="xs" p="xs">
                        {messagesLoading ? (
                            <Text ta="center" c="dimmed">
                                {t('loadingMessages')}
                            </Text>
                        ) : messages?.length === 0 ? (
                            <Text ta="center" c="dimmed" py="xl">
                                {t('noMessagesSayHello')}
                            </Text>
                        ) : (
                            messages?.map((m) => {
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
                                            <Text size="10px" ta="right" className="opacity-70" mt={2}>
                                                {m.createdAt
                                                    ? new Date(m.createdAt).toLocaleTimeString([], {
                                                          hour: '2-digit',
                                                          minute: '2-digit',
                                                      })
                                                    : ''}
                                            </Text>
                                        </Paper>
                                    </Group>
                                );
                            })
                        )}
                        <div ref={chatEndRef} />
                    </Stack>
                </ScrollArea>

                {/* Input box */}
                <form onSubmit={handleSend}>
                    <Group gap="xs" mt="sm">
                        <TextInput
                            placeholder={canChat ? t('typeMessage') : t('mustBeFriendsToChat')}
                            disabled={!canChat}
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.currentTarget.value)}
                            flex={1}
                        />
                        <Button
                            type="submit"
                            disabled={!canChat || !messageInput.trim()}
                            loading={sendMutation.isPending}
                            leftSection={<IconSend size={16} />}
                        >
                            {t('send')}
                        </Button>
                    </Group>
                </form>
            </Card>
        </Stack>
    );
}
