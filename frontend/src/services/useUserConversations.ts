import React, {useEffect, useRef, useState} from 'react';
import {UserProvider} from '../api/providers/UserProvider';
import {ConversationProvider} from '../api/providers/ConversationProvider';
import {FriendProvider} from '../api/providers/FriendProvider';
import {UserResponse} from '../api/responses/UserResponse';
import {ConversationResponse} from '../api/responses/ConversationResponse';
import {ConversationActivityResponse} from '../api/responses/ConversationActivityResponse';
import {UserFilterQuery} from '../api/queries/UserFilterQuery';
import {UserIndexQuery} from '../api/queries/UserIndexQuery';
import {FriendFilterQuery} from '../api/queries/FriendFilterQuery';
import {FriendIndexQuery} from '../api/queries/FriendIndexQuery';
import {ConversationIndexQuery} from '../api/queries/ConversationIndexQuery';
import {ConversationFilterQuery} from '../api/queries/ConversationFilterQuery';
import {ConversationActivityIndexQuery} from '../api/queries/ConversationActivityIndexQuery';
import {ConversationActivityFilterQuery} from '../api/queries/ConversationActivityFilterQuery';
import {ConversationBody} from '../api/body/ConversationBody';
import {useCheckPermission} from '../utils/checkPermission';
import {FriendStatusEnum} from '../enums/FriendStatusEnum';

export function useUserConversations(link?: string) {
    const {getCurrentUser} = useCheckPermission();

    const [targetUser, setTargetUser] = useState<UserResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [activities, setActivities] = useState<ConversationActivityResponse[]>([]);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});
    const [activityPage, setActivityPage] = useState<number>(1);
    const [activityLimit, setActivityLimit] = useState<number>(10);

    const [messages, setMessages] = useState<ConversationResponse[]>([]);
    const [chatPage, setChatPage] = useState<number>(1);
    const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
    const [messageInput, setMessageInput] = useState<string>('');
    const [isSending, setIsSending] = useState<boolean>(false);
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [loadingEarlier, setLoadingEarlier] = useState<boolean>(false);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const lastTypingUpdate = useRef<number>(0);

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
            indexDto.page = activityPage;

            const data = await conversationProvider.indexActivity(indexDto);

            const uniqueOtherUserIds = new Set<string>();
            const deduplicated: ConversationActivityResponse[] = [];

            for (const act of data) {
                const otherId = act.senderUserId === currentUsr.id ? act.receiverUserId : act.senderUserId;
                if (!uniqueOtherUserIds.has(otherId)) {
                    uniqueOtherUserIds.add(otherId);
                    deduplicated.push(act);
                }
            }

            const paginated = deduplicated.slice((activityPage - 1) * activityLimit, activityPage * activityLimit);
            setActivities(paginated);

            if (uniqueOtherUserIds.size > 0) {
                const uFilter = new UserFilterQuery();
                uFilter.userIds = Array.from(uniqueOtherUserIds);
                const uIndexDto = new UserIndexQuery();
                uIndexDto.filter = uFilter;
                uIndexDto.limit = uniqueOtherUserIds.size;
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

            const data = await conversationProvider.index(indexDto);

            setHasMoreMessages(data.length === 20);

            if (append) {
                setMessages(prev => [...data, ...prev]);
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
                if (data.length > 0 && prev.length > 0 && data[0].id !== prev[0].id) {
                    setTimeout(scrollToBottom, 100);
                    return data;
                }
                return prev;
            });

            const actFilter = new ConversationActivityFilterQuery();
            actFilter.userId = tUser.id;
            const actIndexDto = new ConversationActivityIndexQuery();
            actIndexDto.filter = actFilter;
            actIndexDto.limit = 1;
            actIndexDto.sort = 'createdAt:desc';
            const acts = await conversationProvider.indexActivity(actIndexDto);

            if (acts.length > 0) {
                const latestAct = acts[0];
                if (latestAct.senderUserId === tUser.id) {
                    const updatedAt = new Date(latestAct.updatedAt).getTime();
                    const now = Date.now();
                    setIsTyping((now - updatedAt) < 5000);
                }
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
    }, [link, activityPage, activityLimit]);

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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !targetUser) return;

        setIsSending(true);
        try {
            const body = new ConversationBody(messageInput);
            await conversationProvider.create(targetUser.id, body);
            setMessageInput('');
            await fetchMessages(targetUser, 1, false);
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
        if (now - lastTypingUpdate.current > 3000) {
            conversationProvider.updateActivityUpdatedAt(targetUser.id).catch(() => {});
            lastTypingUpdate.current = now;
        }
    };

    return {
        targetUser, currentUser, isMyProfile, loading, error,

        activities, relatedUsers, activityPage, activityLimit,
        setActivityPage, setActivityLimit,

        messages, messageInput, isSending, isTyping, hasMoreMessages, loadingEarlier, chatEndRef,
        handleTyping, handleSendMessage, loadEarlierMessages
    };
}