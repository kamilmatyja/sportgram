import React, {useEffect, useRef, useState} from 'react';
import {UserProvider} from '../../api/providers/UserProvider';
import {ConversationProvider} from '../../api/providers/ConversationProvider';
import {FriendProvider} from '../../api/providers/FriendProvider';
import {UserResponse} from '../../api/responses/UserResponse';
import {ConversationResponse} from '../../api/responses/ConversationResponse';
import {ConversationActivityResponse} from '../../api/responses/ConversationActivityResponse';
import {UserFilterQuery} from '../../api/queries/UserFilterQuery';
import {UserIndexQuery} from '../../api/queries/UserIndexQuery';
import {FriendFilterQuery} from '../../api/queries/FriendFilterQuery';
import {FriendIndexQuery} from '../../api/queries/FriendIndexQuery';
import {ConversationIndexQuery} from '../../api/queries/ConversationIndexQuery';
import {ConversationFilterQuery} from '../../api/queries/ConversationFilterQuery';
import {ConversationActivityIndexQuery} from '../../api/queries/ConversationActivityIndexQuery';
import {ConversationActivityFilterQuery} from '../../api/queries/ConversationActivityFilterQuery';
import {ConversationBody} from '../../api/body/ConversationBody';
import {useCheckPermission} from '../../utils/checkPermission';
import {FriendStatusEnum} from '../../enums/FriendStatusEnum';

export interface ProcessedActivity extends ConversationActivityResponse {
    otherUser: UserResponse;
}

export function useUserConversations(link?: string) {
    const {getCurrentUser} = useCheckPermission();

    const [targetUser, setTargetUser] = useState<UserResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [rawActivities, setRawActivities] = useState<ConversationActivityResponse[]>([]);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});
    const [activityPage, setActivityPage] = useState<number>(1);
    const [activityLimit, setActivityLimit] = useState<number>(10);
    const [activitySort, setActivitySort] = useState<string>('updatedAt:desc');
    const [activitySearch, setActivitySearch] = useState<string>('');

    const [messages, setMessages] = useState<ConversationResponse[]>([]);
    const [chatPage, setChatPage] = useState<number>(1);
    const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
    const [messageInput, setMessageInput] = useState<string>('');
    const [isSending, setIsSending] = useState<boolean>(false);
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [loadingEarlier, setLoadingEarlier] = useState<boolean>(false);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const lastTypingPatch = useRef<number>(0);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const userProvider = new UserProvider();
    const conversationProvider = new ConversationProvider();
    const friendProvider = new FriendProvider();

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({behavior: 'smooth'});
    };

    const fetchActivities = async (currentUsr: UserResponse) => {
        try {
            setLoading(true);
            const indexDto = new ConversationActivityIndexQuery();
            indexDto.limit = 100;

            const data = await conversationProvider.indexActivity(indexDto);
            setRawActivities(data);

            const otherUserIds = Array.from(
                new Set(data.map(act => act.senderUserId === currentUsr.id ? act.receiverUserId : act.senderUserId))
            );

            if (otherUserIds.length > 0) {
                const uFilter = new UserFilterQuery();
                uFilter.userIds = otherUserIds;
                const uIndexDto = new UserIndexQuery();
                uIndexDto.filter = uFilter;
                uIndexDto.limit = otherUserIds.length;
                const usersData = await userProvider.index(uIndexDto);

                const usersMap = usersData.reduce((acc, curr) => {
                    acc[curr.id] = curr;
                    return acc;
                }, {} as Record<string, UserResponse>);
                setRelatedUsers(usersMap);
            }
        } catch (e: any) {
            setError(e.error);
        } finally {
            setLoading(false);
        }
    };

    const processActivities = (): { paginated: ProcessedActivity[], total: number } => {
        if (!currentUser) return {paginated: [], total: 0};

        const mapped: ProcessedActivity[] = rawActivities
            .map(act => {
                const otherId = act.senderUserId === currentUser.id ? act.receiverUserId : act.senderUserId;
                return {...act, otherUser: relatedUsers[otherId]};
            })
            .filter(act => act.otherUser !== undefined);

        const uniqueMap = new Map<string, ProcessedActivity>();
        for (const act of mapped) {
            if (!uniqueMap.has(act.otherUser.id)) {
                uniqueMap.set(act.otherUser.id, act);
            }
        }
        let processed = Array.from(uniqueMap.values());

        if (activitySearch) {
            const search = activitySearch.toLowerCase();
            processed = processed.filter(act =>
                act.otherUser.firstName.toLowerCase().includes(search) ||
                act.otherUser.lastName.toLowerCase().includes(search) ||
                act.otherUser.link.toLowerCase().includes(search)
            );
        }

        processed.sort((a, b) => {
            const [field, dir] = activitySort.split(':');
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
        const paginated = processed.slice((activityPage - 1) * activityLimit, activityPage * activityLimit);

        return {paginated, total};
    };

    const fetchMessages = async (tUser: UserResponse, pageToFetch: number = 1, append: boolean = false) => {
        try {
            if (!append) setLoading(true);
            else setLoadingEarlier(true);

            const filter = new ConversationFilterQuery();
            filter.userId = tUser.id;

            const indexDto = new ConversationIndexQuery();
            indexDto.filter = filter;
            indexDto.page = pageToFetch;
            indexDto.limit = 20;
            indexDto.sort = 'createdAt:desc';

            const data = await conversationProvider.index(indexDto);
            setHasMoreMessages(data.length === 20);

            if (append) {
                setMessages(prev => [...prev, ...data]);
            } else {
                setMessages(data);
                setTimeout(scrollToBottom, 100);
            }
        } catch (e: any) {
            setError(e.error);
        } finally {
            setLoading(false);
            setLoadingEarlier(false);
        }
    };

    const pollUpdates = async (tUser: UserResponse) => {
        try {
            const filter = new ConversationFilterQuery();
            filter.userId = tUser.id;
            const indexDto = new ConversationIndexQuery();
            indexDto.filter = filter;
            indexDto.limit = 20;
            const data = await conversationProvider.index(indexDto);

            setMessages(prev => {
                const newMessages = data.filter(newMsg => !prev.some(oldMsg => oldMsg.id === newMsg.id));
                if (newMessages.length > 0) {
                    setTimeout(scrollToBottom, 100);
                    return [...newMessages, ...prev];
                }
                return prev;
            });

            const actFilter = new ConversationActivityFilterQuery();
            actFilter.userId = tUser.id;
            const actIndexDto = new ConversationActivityIndexQuery();
            actIndexDto.filter = actFilter;
            const acts = await conversationProvider.indexActivity(actIndexDto);

            const targetActivity = acts.find(a => a.senderUserId === tUser.id);
            if (targetActivity) {
                const timeStr = targetActivity.updatedAt.endsWith('Z')
                    ? targetActivity.updatedAt
                    : `${targetActivity.updatedAt}Z`;

                const serverTimeMs = new Date(timeStr).getTime();
                const nowMs = Date.now();
                const diffMs = nowMs - serverTimeMs;

                if (diffMs <= 10000 && diffMs >= -10000) {
                    setIsTyping(true);

                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

                    typingTimeoutRef.current = setTimeout(() => {
                        setIsTyping(false);
                    }, 5000 - diffMs);
                } else {
                    setIsTyping(false);
                }
            } else {
                setIsTyping(false);
            }

        } catch (e) {
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const currentUsr = await getCurrentUser();
                setCurrentUser(currentUsr);

                if (!currentUsr || !link) {
                    setError('unauthorizedEdit');
                    return;
                }

                const uFilter = new UserFilterQuery();
                uFilter.link = link;
                const uIndexDto = new UserIndexQuery();
                uIndexDto.filter = uFilter;
                const targetUsers = await userProvider.index(uIndexDto);

                if (targetUsers.length === 0) {
                    setError('userNotFound');
                    return;
                }

                const tUser = targetUsers[0];
                setTargetUser(tUser);

                const isOwner = currentUsr.id === tUser.id;
                setIsMyProfile(isOwner);

                if (isOwner) {
                    await fetchActivities(currentUsr);
                } else {
                    const fFilter = new FriendFilterQuery();
                    fFilter.status = FriendStatusEnum.ACCEPTED;
                    fFilter.userIds = [tUser.id, currentUsr.id];
                    const fIndexDto = new FriendIndexQuery();
                    fIndexDto.filter = fFilter;
                    const friends = await friendProvider.index(fIndexDto);

                    if (friends.length < 1) {
                        setError('accessDenied');
                        setLoading(false);
                        return;
                    }

                    await fetchMessages(tUser, 1, false);
                }
            } catch (err: any) {
                setError(err.error);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [link]);

    useEffect(() => {
        if (isMyProfile || !targetUser || !currentUser) return;
        const intervalId = setInterval(() => pollUpdates(targetUser), 3000);
        return () => clearInterval(intervalId);
    }, [isMyProfile, targetUser, currentUser]);


    const loadEarlierMessages = () => {
        if (!targetUser) return;
        const nextPage = chatPage + 1;
        setChatPage(nextPage);
        fetchMessages(targetUser, nextPage, true);
    };

    const handleSendMessage = async (e: React.ChangeEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!messageInput.trim() || !targetUser) return;

        setIsSending(true);
        try {
            const body = new ConversationBody(messageInput);
            await conversationProvider.create(targetUser.id, body);
            setMessageInput('');
            setIsTyping(false);
            await fetchMessages(targetUser, 1, false);
            setTimeout(scrollToBottom, 100);
        } catch (e: any) {
            alert(e.error);
        } finally {
            setIsSending(false);
        }
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessageInput(e.target.value);
        if (!targetUser) return;

        const now = Date.now();
        if (now - lastTypingPatch.current > 3000) {
            conversationProvider.updateActivityUpdatedAt(targetUser.id).catch(() => {
            });
            lastTypingPatch.current = now;
        }
    };

    const {paginated: paginatedActivities, total: totalActivities} = processActivities();

    return {
        targetUser, currentUser, isMyProfile, loading, error,

        activities: paginatedActivities,
        totalActivities,
        activityPage,
        activityLimit,
        activitySort,
        activitySearch,
        setActivityPage,
        setActivityLimit,
        setActivitySort,
        setActivitySearch,

        messages, messageInput, isSending, isTyping, hasMoreMessages, loadingEarlier, chatEndRef,
        handleTyping, handleSendMessage, loadEarlierMessages
    };
}