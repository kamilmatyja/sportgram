import React, {useEffect, useState} from 'react';
import {PageProvider} from '../../api/providers/PageProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {EventProvider} from '../../api/providers/EventProvider';
import {PageResponse} from '../../api/responses/PageResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {EventResponse} from '../../api/responses/EventResponse';
import {PageFollowResponse} from '../../api/responses/PageFollowResponse';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {PageFilterQuery} from '../../api/queries/PageFilterQuery';
import {PageIndexQuery} from '../../api/queries/PageIndexQuery';
import {EventFilterQuery} from '../../api/queries/EventFilterQuery';
import {EventIndexQuery} from '../../api/queries/EventIndexQuery';
import {PageFollowStatusEnum} from '../../enums/PageFollowStatusEnum';
import {StatusBody} from '../../api/body/StatusBody';
import {fetchRelatedUsers} from '../../utils/fetchRelatedUsers';

export function usePageDetails(link?: string) {
    const access = useAppAccess();

    const [pageObj, setPageObj] = useState<PageResponse | null>(null);
    const [ownerUser, setOwnerUser] = useState<UserResponse | null>(null);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});

    const [events, setEvents] = useState<EventResponse[]>([]);
    const [eventPage, setEventPage] = useState<number>(1);
    const [eventLimit, setEventLimit] = useState<number>(10);
    const [eventSort, setEventSort] = useState<string>('createdAt:desc');
    const [eventFilters, setEventFilters] = useState(new EventFilterQuery());
    const [eventsLoading, setEventsLoading] = useState<boolean>(false);

    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
    const [isParticipantOfPage, setIsParticipantOfPage] = useState<boolean>(false);

    const [myFollow, setMyFollow] = useState<PageFollowResponse | null>(null);
    const [followLoading, setFollowLoading] = useState<boolean>(false);

    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const pageProvider = new PageProvider();
    const userProvider = new UserProvider();
    const eventProvider = new EventProvider();

    const fetchEvents = async (targetPageId: string) => {
        setEventsLoading(true);
        try {
            const filterDto = new EventFilterQuery();
            filterDto.pageId = targetPageId;
            filterDto.title = eventFilters.title;
            filterDto.link = eventFilters.link;
            filterDto.status = eventFilters.status ? Number(eventFilters.status) : undefined;

            const indexDto = new EventIndexQuery();
            indexDto.page = eventPage;
            indexDto.limit = eventLimit;
            indexDto.sort = eventSort;
            indexDto.filter = filterDto;

            const data = await eventProvider.index(indexDto);
            setEvents(data);
        } catch (err: any) {
            console.error(err);
        } finally {
            setEventsLoading(false);
        }
    };

    const fetchPageData = async () => {
        if (!link || !access.currentUser) return;

        setDataLoading(true);
        setDataError(null);
        try {
            const filterDto = new PageFilterQuery();
            filterDto.link = link;
            const indexDto = new PageIndexQuery();
            indexDto.filter = filterDto;

            const pagesData = await pageProvider.index(indexDto);

            if (pagesData.length === 0) {
                setDataError('noPages');
                return;
            }

            const targetPage = await pageProvider.details(pagesData[0].id, [
                'pageParticipants',
                'pageFollows'
            ]);

            setPageObj(targetPage);

            const owner = await userProvider.details(targetPage.userId);
            setOwnerUser(owner);

            setIsMyProfile(access.currentUser.id === owner.id);

            const participantCheck = targetPage.participants?.some(p => p.userId === access.currentUser!.id) ?? false;
            setIsParticipantOfPage(participantCheck);

            const existingFollow = targetPage.follows?.find(f => f.userId === access.currentUser!.id) || null;
            setMyFollow(existingFollow);

            const userIds = [
                ...targetPage.participants.map(p => p.userId),
                ...(targetPage.follows?.map(f => f.userId) || [])
            ];

            const updatedUsers = await fetchRelatedUsers(userIds, relatedUsers, userProvider);
            setRelatedUsers(updatedUsers);

            await fetchEvents(targetPage.id);

        } catch (err: any) {
            setDataError(err.error);
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError) {
            fetchPageData();
        }
    }, [link, access.authLoading, access.authError]);

    useEffect(() => {
        if (pageObj) {
            fetchEvents(pageObj.id);
        }
    }, [eventPage, eventLimit, eventSort, eventFilters]);

    const handleEventFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setEventFilters(prev => ({...prev, [e.target.name]: e.target.value}));
        setEventPage(1);
    };

    const handleEventSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setEventSort(e.target.value);
    };

    const handleEventLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setEventLimit(Number(e.target.value));
        setEventPage(1);
    };

    const handleEventPrevPage = () => setEventPage(prev => Math.max(prev - 1, 1));
    const handleEventNextPage = () => setEventPage(prev => prev + 1);

    const handleToggleFollow = async () => {
        if (!pageObj || !access.currentUser) return;
        setFollowLoading(true);
        try {
            if (!myFollow) {
                await pageProvider.createFollow(pageObj.id, new StatusBody(PageFollowStatusEnum.ACCEPTED));
            } else {
                const newStatus = myFollow.status === PageFollowStatusEnum.ACCEPTED
                    ? PageFollowStatusEnum.UNFOLLOWED
                    : PageFollowStatusEnum.ACCEPTED;
                await pageProvider.updateFollowStatus(myFollow.id, new StatusBody(newStatus));
            }
            await fetchPageData();
        } catch (err: any) {
            alert(err.error || 'Error');
        } finally {
            setFollowLoading(false);
        }
    };

    const refreshPage = () => {
        fetchPageData();
    };

    return {
        ...access,
        pageObj,
        ownerUser,
        relatedUsers,
        isMyProfile,
        isParticipantOfPage,
        myFollow,
        followLoading,
        handleToggleFollow,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        events,
        eventsLoading,
        eventPage,
        eventLimit,
        eventSort,
        eventFilters,
        handleEventFilterChange,
        handleEventSortChange,
        handleEventLimitChange,
        handleEventPrevPage,
        handleEventNextPage,
        refreshPage
    };
}