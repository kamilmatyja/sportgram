import React, {useEffect, useState} from 'react';
import {PageProvider} from '../../api/providers/PageProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {EventProvider} from '../../api/providers/EventProvider';
import {PageResponse} from '../../api/responses/PageResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {EventResponse} from '../../api/responses/EventResponse';
import {PageFollowResponse} from '../../api/responses/PageFollowResponse';
import {useCheckPermission} from '../../utils/checkPermission';
import {UserIndexQuery} from '../../api/queries/UserIndexQuery';
import {UserFilterQuery} from '../../api/queries/UserFilterQuery';
import {PageFilterQuery} from '../../api/queries/PageFilterQuery';
import {PageIndexQuery} from '../../api/queries/PageIndexQuery';
import {EventFilterQuery} from '../../api/queries/EventFilterQuery';
import {EventIndexQuery} from '../../api/queries/EventIndexQuery';
import {RoleEnum} from '../../enums/RoleEnum';
import {PageFollowStatusEnum} from '../../enums/PageFollowStatusEnum';
import {StatusBody} from '../../api/body/StatusBody';

export function usePageDetails(link?: string) {
    const {getCurrentUser} = useCheckPermission();

    const [pageObj, setPageObj] = useState<PageResponse | null>(null);
    const [ownerUser, setOwnerUser] = useState<UserResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});

    const [events, setEvents] = useState<EventResponse[]>([]);
    const [eventPage, setEventPage] = useState<number>(1);
    const [eventLimit, setEventLimit] = useState<number>(10);
    const [eventSort, setEventSort] = useState<string>('createdAt:desc');
    const [eventFilters, setEventFilters] = useState(new EventFilterQuery());
    const [eventsLoading, setEventsLoading] = useState<boolean>(false);

    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isParticipantOfPage, setIsParticipantOfPage] = useState<boolean>(false);

    const [myFollow, setMyFollow] = useState<PageFollowResponse | null>(null);
    const [followLoading, setFollowLoading] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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
        setLoading(true);
        setError(null);
        try {
            const currentUsr = await getCurrentUser();
            setCurrentUser(currentUsr);

            if (!currentUsr || !link) {
                setError('unauthorizedEdit');
                return;
            }

            const adminCheck = currentUsr.roles?.some((r: any) => r.role === RoleEnum.ADMINISTRATOR) ?? false;
            setIsAdmin(adminCheck);

            const filterDto = new PageFilterQuery();
            filterDto.link = link;
            const indexDto = new PageIndexQuery();
            indexDto.filter = filterDto;

            const pagesData = await pageProvider.index(indexDto);

            if (pagesData.length === 0) {
                setError('noPages');
                return;
            }

            const targetPage = await pageProvider.details(pagesData[0].id, [
                'pageParticipants',
                'pageFollows'
            ]);

            setPageObj(targetPage);

            const owner = await userProvider.details(targetPage.userId);
            setOwnerUser(owner);

            const isOwner = currentUsr.id === owner.id;
            setIsMyProfile(isOwner);

            const participantCheck = targetPage.participants?.some(p => p.userId === currentUsr.id) ?? false;
            setIsParticipantOfPage(participantCheck);

            const existingFollow = targetPage.follows?.find(f => f.userId === currentUsr.id) || null;
            setMyFollow(existingFollow);

            const userIdsToFetch = new Set<string>();
            targetPage.participants.forEach(p => userIdsToFetch.add(p.userId));
            targetPage.follows?.forEach(f => userIdsToFetch.add(f.userId));

            const idsArray = Array.from(userIdsToFetch);
            if (idsArray.length > 0) {
                const uFilter = new UserFilterQuery();
                uFilter.userIds = idsArray;
                const uIndexDto = new UserIndexQuery();
                uIndexDto.filter = uFilter;
                uIndexDto.limit = idsArray.length;
                const usersData = await userProvider.index(uIndexDto);
                const usersMap = usersData.reduce((acc, curr) => {
                    acc[curr.id] = curr;
                    return acc;
                }, {} as Record<string, UserResponse>);
                setRelatedUsers(usersMap);
            }

            await fetchEvents(targetPage.id);

        } catch (err: any) {
            setError(err.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPageData();
    }, [link]);

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
        if (!pageObj || !currentUser) return;
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
        pageObj,
        ownerUser,
        currentUser,
        relatedUsers,
        isMyProfile,
        isAdmin,
        isParticipantOfPage,
        myFollow,
        followLoading,
        handleToggleFollow,
        loading,
        error,
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