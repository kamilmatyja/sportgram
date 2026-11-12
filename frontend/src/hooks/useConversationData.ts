import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import {
    conversationService,
    friendService,
    type ConversationResource,
    type FriendResource,
    type GetConversationsQuery,
    type UserResource,
} from '../api/services';
import { useAuth } from '../auth';
import { ConversationStatusEnum } from '../enums/ConversationStatusEnum';
import { FriendStatusEnum } from '../enums/FriendStatusEnum';
import { useUsersMap } from './useUsersMap';
import { useOnlineStatus } from './useOnlineStatus';

type ConversationResponse = Awaited<ReturnType<typeof conversationService.getConversations>>;

interface UseConversationDataOptions {
    targetUser: UserResource;
    isOwner: boolean;
    page: number;
    limit: number;
    sort: string | null;
    statusFilter: number | null;
}

export function useConversationData({
    targetUser,
    isOwner,
    page,
    limit,
    sort,
    statusFilter,
}: UseConversationDataOptions) {
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();
    const isOnline = useOnlineStatus();

    const { data: friendship } = useQuery({
        queryKey: ['friendship', currentUser?.id, targetUser.id],
        queryFn: async () => {
            if (!currentUser || isOwner) return null;
            if (!isOnline) {
                return queryClient.getQueryData<FriendResource>(['friendship', currentUser.id, targetUser.id]) ?? null;
            }
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
                    (friend) =>
                        (friend.senderUserId === targetUser.id && friend.receiverUserId === currentUser.id) ||
                        (friend.senderUserId === currentUser.id && friend.receiverUserId === targetUser.id),
                ) ?? null
            );
        },
        enabled: !!currentUser && !isOwner,
    });
    const canChat = !isOwner && friendship?.status === FriendStatusEnum.ACCEPTED;

    const conversationsQueryKey = [
        'conversations-data',
        currentUser?.id,
        targetUser.id,
        page,
        limit,
        sort,
        statusFilter,
    ] as const;

    const { data: conversationsResponse, isLoading: conversationsLoading } = useQuery({
        queryKey: conversationsQueryKey,
        queryFn: async () => {
            if (!currentUser || !isOwner) return { data: [], pagination: null };
            if (!isOnline) {
                return (
                    queryClient.getQueryData<ConversationResponse>(conversationsQueryKey) ?? {
                        data: [],
                        pagination: null,
                    }
                );
            }
            return conversationService.getConversations({
                params: {
                    query: {
                        page,
                        limit,
                        sort: sort as NonNullable<GetConversationsQuery>['sort'],
                        filter: {
                            ...(statusFilter
                                ? {
                                      status: statusFilter as NonNullable<
                                          NonNullable<GetConversationsQuery>['filter']
                                      >['status'],
                                  }
                                : {}),
                        },
                    },
                },
            });
        },
        enabled: isOwner && !!currentUser,
        refetchInterval: isOnline ? 10000 : false,
    });

    const chatQueryKey = ['chat-messages', currentUser?.id, targetUser.id] as const;
    const {
        data: chatInfiniteData,
        isLoading: chatLoading,
        fetchNextPage: fetchNextChatPage,
        hasNextPage: hasMoreChatMessages,
        isFetchingNextPage: isFetchingMoreChatMessages,
    } = useInfiniteQuery({
        queryKey: chatQueryKey,
        queryFn: async ({ pageParam = 1 }) => {
            if (!currentUser) return { data: [], pagination: {} };
            if (!isOnline) {
                const cached = queryClient.getQueryData<InfiniteData<ConversationResponse>>(chatQueryKey);
                return cached?.pages?.[Number(pageParam) - 1] ?? { data: [], pagination: {} };
            }
            return conversationService.getConversations({
                params: {
                    query: {
                        page: pageParam,
                        limit: 10,
                        sort: 'createdAt:desc',
                        filter: { userId: targetUser.id },
                    },
                },
            });
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.pagination?.hasNextPage && lastPage.pagination.page ? lastPage.pagination.page + 1 : undefined,
        enabled: !isOwner && !!currentUser,
        refetchInterval: isOnline ? 3000 : false,
    });

    const lastMessagesRef = useRef<ConversationResource[]>([]);
    const chatMessages = useMemo(() => {
        if (isOwner) return [];
        const messages = chatInfiniteData?.pages.flatMap((pageData) => pageData.data ?? []) ?? [];
        if (messages.length > 0) {
            const sorted = [...messages].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            );
            lastMessagesRef.current = sorted;
            return sorted;
        }
        return !isOnline ? lastMessagesRef.current : [];
    }, [isOwner, chatInfiniteData, isOnline]);

    const userIdsToFetch = useMemo(() => {
        if (!isOwner) return [];
        const ids = new Set<string>();
        conversationsResponse?.data?.forEach((conversation) => {
            if (conversation.senderUserId) ids.add(conversation.senderUserId);
            if (conversation.receiverUserId) ids.add(conversation.receiverUserId);
        });
        return Array.from(ids);
    }, [isOwner, conversationsResponse?.data]);
    const { getUser } = useUsersMap(userIdsToFetch);

    const lastOwnerMessagesRef = useRef<ConversationResource[]>([]);
    const messages = useMemo(() => {
        if (!isOwner) return chatMessages;
        const data = conversationsResponse?.data ?? [];
        if (data.length > 0) {
            lastOwnerMessagesRef.current = data;
            return data;
        }
        return !isOnline ? lastOwnerMessagesRef.current : [];
    }, [isOwner, conversationsResponse?.data, isOnline, chatMessages]);

    const activitiesQueryKey = ['conversation-activities', currentUser?.id, targetUser.id] as const;
    const { data: activitiesData } = useQuery({
        queryKey: activitiesQueryKey,
        queryFn: async () => {
            if (!currentUser || isOwner) return [];
            if (!isOnline) {
                return (
                    queryClient.getQueryData<
                        Awaited<ReturnType<typeof conversationService.getConversationActivities>>['data']
                    >(activitiesQueryKey) ?? []
                );
            }
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
        refetchInterval: isOnline ? 5000 : false,
    });

    const isPartnerTyping = useMemo(() => {
        if (!activitiesData?.length || !currentUser?.id) return false;
        const partnerActivity = activitiesData.find(
            (activity) => activity.senderUserId === targetUser.id && activity.receiverUserId === currentUser.id,
        );
        if (!partnerActivity) return false;
        if (partnerActivity.isWriting) return true;
        return Date.now() - new Date(partnerActivity.updatedAt).getTime() <= 6000;
    }, [activitiesData, targetUser.id, currentUser?.id]);

    const lastIncomingMessage = useMemo(() => {
        if (isOwner || messages.length === 0) return null;
        for (let index = messages.length - 1; index >= 0; index--) {
            if (messages[index].senderUserId === targetUser.id) return messages[index];
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
            isOnline &&
            lastIncomingMessage &&
            lastIncomingMessage.status !== ConversationStatusEnum.READ &&
            markedReadMsgIdRef.current !== lastIncomingMessage.id
        ) {
            markedReadMsgIdRef.current = lastIncomingMessage.id;
            void conversationService
                .updateConversationStatus({
                    params: { path: { id: lastIncomingMessage.id } },
                    body: { status: ConversationStatusEnum.READ },
                })
                .then(() => queryClient.invalidateQueries({ queryKey: ['chat-messages'] }))
                .catch((error: unknown) => console.error('Failed to mark conversation as read:', error));
        }
    }, [isOwner, isOnline, lastIncomingMessage, queryClient]);

    const lastActivitySentRef = useRef<number>(0);
    const recordActivity = useCallback(() => {
        if (!isOnline || isOwner) return;
        const now = Date.now();
        if (now - lastActivitySentRef.current < 4500) return;
        lastActivitySentRef.current = now;
        void conversationService
            .updateConversationActivityUpdatedAt({ params: { path: { id: targetUser.id } } })
            .catch((error: unknown) => console.error('Failed to update conversation activity:', error));
    }, [isOwner, isOnline, targetUser.id]);

    const resetActivityThrottle = useCallback(() => {
        lastActivitySentRef.current = 0;
    }, []);

    return {
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
    };
}
