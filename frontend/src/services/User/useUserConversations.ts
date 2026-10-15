import React, { useEffect, useRef, useState } from 'react';

import { ConversationBody } from '../../api/body/ConversationBody';
import { ConversationProvider } from '../../api/providers/ConversationProvider';
import { ConversationActivityFilterQuery } from '../../api/queries/ConversationActivityFilterQuery';
import { ConversationActivityIndexQuery } from '../../api/queries/ConversationActivityIndexQuery';
import { ConversationFilterQuery } from '../../api/queries/ConversationFilterQuery';
import { ConversationIndexQuery } from '../../api/queries/ConversationIndexQuery';
import { ConversationActivityResponse } from '../../api/responses/ConversationActivityResponse';
import { ConversationResponse } from '../../api/responses/ConversationResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { createSubmitHandler } from '../../utils/formHandler';
import { isAccessReady, useAppAccess } from '../../utils/hooks/useAppAccess';
import { useDataFetch } from '../../utils/hooks/useDataFetch';
import { useFormState } from '../../utils/hooks/useFormState';
import { useListFilters } from '../../utils/hooks/useListFilters';
import { useRelatedUsers } from '../../utils/hooks/useRelatedUsers';
import { fetchAllPages } from '../../utils/query';

const MESSAGES_PER_PAGE = 20;
const POLL_INTERVAL_MS = 3000;
const TYPING_THROTTLE_MS = 3000;

type ActivityWithUser = ConversationActivityResponse & { otherUser: UserResponse };

const otherUserId = (act: ConversationActivityResponse, currentUserId: string) =>
    act.senderUserId === currentUserId ? act.receiverUserId : act.senderUserId;

const mergeMessages = (current: ConversationResponse[], incoming: ConversationResponse[], prepend: boolean) => {
    const knownIds = new Set(current.map((msg) => msg.id));
    const newMessages = incoming.filter((msg) => !knownIds.has(msg.id));
    if (newMessages.length === 0) return current;
    return prepend ? [...newMessages, ...current] : [...current, ...newMessages];
};

const buildMessagesQuery = (tUser: UserResponse, page: number) => {
    const filter = new ConversationFilterQuery();
    filter.userId = tUser.id;
    const indexDto = new ConversationIndexQuery();
    indexDto.filter = filter;
    indexDto.page = page;
    indexDto.limit = MESSAGES_PER_PAGE;
    return indexDto;
};

export function useUserConversations(link?: string) {
    const access = useAppAccess({ targetLink: link, requireFriendship: true });

    const [canSendMessages, setCanSendMessages] = useState<boolean>(false);
    const { relatedUsers, loadRelatedUsers } = useRelatedUsers();

    const {
        data: rawActivities,
        loading: actLoading,
        error: actError,
        executeFetch: fetchActs,
    } = useDataFetch<ConversationActivityResponse[]>();
    const {
        data: messages,
        setData: setMessages,
        loading: msgLoading,
        error: msgError,
        executeFetch: fetchMsgs,
    } = useDataFetch<ConversationResponse[]>();
    const { fieldErrors, wrap } = useFormState();

    const activityList = useListFilters({ search: '' }, 'updatedAt:desc');

    const [chatPage, setChatPage] = useState<number>(1);
    const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
    const [messageInput, setMessageInput] = useState<string>('');
    const [isSending, setIsSending] = useState<boolean>(false);
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [loadingEarlier, setLoadingEarlier] = useState<boolean>(false);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const lastTypingPatch = useRef<number>(0);
    const targetUserRef = useRef<UserResponse | null>(null);
    targetUserRef.current = access.targetUser;

    const conversationProvider = new ConversationProvider();

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchActivities = (currentUsr: UserResponse) => {
        fetchActs(async () => {
            const data = await fetchAllPages(new ConversationActivityIndexQuery(), (query) =>
                conversationProvider.indexActivity(query),
            );

            await loadRelatedUsers(data.map((act) => otherUserId(act, currentUsr.id)));

            return data;
        }, []);
    };

    const processActivities = (): { paginated: ActivityWithUser[]; total: number } => {
        const currentUser = access.currentUser;
        if (!currentUser || !rawActivities) return { paginated: [], total: 0 };

        const mapped = rawActivities
            .map((act) => ({ ...act, otherUser: relatedUsers[otherUserId(act, currentUser.id)] }))
            .filter((act): act is ActivityWithUser => act.otherUser !== undefined);

        const uniqueMap = new Map<string, ActivityWithUser>();
        for (const act of mapped) {
            if (!uniqueMap.has(act.otherUser.id)) {
                uniqueMap.set(act.otherUser.id, act);
            }
        }
        let processed = Array.from(uniqueMap.values());

        if (activityList.filters.search) {
            const search = activityList.filters.search.toLowerCase();
            processed = processed.filter(
                (act) =>
                    act.otherUser.firstName.toLowerCase().includes(search) ||
                    act.otherUser.lastName.toLowerCase().includes(search) ||
                    act.otherUser.link.toLowerCase().includes(search),
            );
        }

        processed.sort((a, b) => {
            const [field, dir] = activityList.sort.split(':');
            const mod = dir === 'desc' ? -1 : 1;
            if (field === 'updatedAt') {
                return mod * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
            }
            if (field === 'user') {
                return mod * a.otherUser.firstName.localeCompare(b.otherUser.firstName);
            }
            return 0;
        });

        const total = processed.length;
        const paginated = processed.slice(
            (activityList.page - 1) * activityList.limit,
            activityList.page * activityList.limit,
        );

        return { paginated, total };
    };

    const fetchMessagesData = (tUser: UserResponse) =>
        fetchMsgs(async (isLatest) => {
            const response = await conversationProvider.index(buildMessagesQuery(tUser, 1));
            if (isLatest()) {
                setHasMoreMessages(response.pagination.hasNextPage);
                setChatPage(1);
                setTimeout(scrollToBottom, 100);
            }
            return response.data;
        }, messages || []);

    const pollUpdates = async (tUser: UserResponse) => {
        try {
            const data = (await conversationProvider.index(buildMessagesQuery(tUser, 1))).data;
            if (tUser.id !== targetUserRef.current?.id) return;

            setMessages((prev) => {
                const current = prev || [];
                const merged = mergeMessages(current, data, true);
                if (merged !== current) setTimeout(scrollToBottom, 100);
                return merged;
            });

            const actFilter = new ConversationActivityFilterQuery();
            actFilter.userId = tUser.id;
            const actIndexDto = new ConversationActivityIndexQuery();
            actIndexDto.filter = actFilter;
            const acts = (await conversationProvider.indexActivity(actIndexDto)).data;

            setIsTyping(acts.find((a) => a.senderUserId === tUser.id)?.isWriting ?? false);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (isAccessReady(access) && access.currentUser && access.targetUser) {
            setCanSendMessages(access.friendship?.status === FriendStatusEnum.ACCEPTED);
            if (access.isMyProfile) {
                fetchActivities(access.currentUser);
            } else {
                fetchMessagesData(access.targetUser);
            }
        }
    }, [access.authLoading, access.authError, access.targetUser]);

    useEffect(() => {
        const targetUser = access.targetUser;
        if (!isAccessReady(access) || access.isMyProfile || !targetUser || !access.currentUser) return;
        const intervalId = setInterval(() => pollUpdates(targetUser), POLL_INTERVAL_MS);
        return () => clearInterval(intervalId);
    }, [access.authLoading, access.authError, access.isMyProfile, access.targetUser, access.currentUser]);

    const loadEarlierMessages = async () => {
        const targetUser = access.targetUser;
        if (!targetUser || loadingEarlier) return;
        const nextPage = chatPage + 1;
        setLoadingEarlier(true);
        try {
            const response = await conversationProvider.index(buildMessagesQuery(targetUser, nextPage));
            if (targetUser.id !== targetUserRef.current?.id) return;
            setMessages((prev) => mergeMessages(prev || [], response.data, false));
            setHasMoreMessages(response.pagination.hasNextPage);
            setChatPage(nextPage);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingEarlier(false);
        }
    };

    const handleSendMessage = createSubmitHandler(async () => {
        const targetUser = access.targetUser;
        if (!messageInput.trim() || !targetUser || !canSendMessages) return;

        setIsSending(true);
        await wrap(async () => {
            await conversationProvider.create(targetUser.id, new ConversationBody(messageInput));
            setMessageInput('');
            setIsTyping(false);
            await fetchMessagesData(targetUser);
        })
            .catch(() => {})
            .finally(() => setIsSending(false));
    });

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessageInput(e.target.value);
        if (!access.targetUser || !canSendMessages) return;

        const now = Date.now();
        if (now - lastTypingPatch.current > TYPING_THROTTLE_MS) {
            conversationProvider.updateActivityUpdatedAt(access.targetUser.id).catch(() => {});
            lastTypingPatch.current = now;
        }
    };

    const { paginated, total } = processActivities();

    return {
        ...access,
        canSendMessages,
        loading: access.authLoading || (access.isMyProfile ? actLoading : msgLoading),
        error: access.authError || (access.isMyProfile ? actError : msgError),
        activities: paginated,
        totalActivities: total,
        activityPage: activityList.page,
        activityLimit: activityList.limit,
        activitySort: activityList.sort,
        activitySearch: activityList.filters.search,
        setActivityPage: activityList.setPage,
        setActivityLimit: activityList.setLimit,
        setActivitySort: activityList.setSort,
        setActivitySearch: (search: string) => {
            activityList.setFilters({ search });
            activityList.setPage(1);
        },
        messages: messages || [],
        messageInput,
        isSending,
        isTyping,
        hasMoreMessages,
        loadingEarlier,
        chatEndRef,
        fieldErrors,
        handleTyping,
        handleSendMessage,
        loadEarlierMessages,
    };
}
