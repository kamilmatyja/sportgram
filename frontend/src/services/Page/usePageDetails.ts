import {useEffect, useState} from 'react';
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
import {useListFilters} from '../../utils/hooks/useListFilters';
import {useDataFetch} from '../../utils/hooks/useDataFetch';

export function usePageDetails(link?: string) {
    const access = useAppAccess();
    const eventsList = useListFilters(new EventFilterQuery());

    const { data: pageObj, loading: pageLoading, error: pageError, executeFetch: fetchPage } = useDataFetch<PageResponse>();
    const { data: events, loading: eventsLoading, executeFetch: executeEventsFetch } = useDataFetch<EventResponse[]>();

    const [ownerUser, setOwnerUser] = useState<UserResponse | null>(null);
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});
    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
    const [isParticipantOfPage, setIsParticipantOfPage] = useState<boolean>(false);
    const [myFollow, setMyFollow] = useState<PageFollowResponse | null>(null);
    const [followLoading, setFollowLoading] = useState<boolean>(false);

    const pageProvider = new PageProvider();
    const userProvider = new UserProvider();
    const eventProvider = new EventProvider();

    const fetchEventsData = (targetPageId: string) => {
        executeEventsFetch(async () => {
            const filterDto = new EventFilterQuery();
            filterDto.pageId = targetPageId;
            filterDto.title = eventsList.filters.title;
            filterDto.link = eventsList.filters.link;
            filterDto.status = eventsList.filters.status ? Number(eventsList.filters.status) : undefined;

            const indexDto = new EventIndexQuery();
            indexDto.page = eventsList.page;
            indexDto.limit = eventsList.limit;
            indexDto.sort = eventsList.sort;
            indexDto.filter = filterDto;

            return await eventProvider.index(indexDto);
        }, []);
    };

    const fetchPageData = () => {
        if (!link || !access.currentUser) return;

        fetchPage(async () => {
            const filterDto = new PageFilterQuery();
            filterDto.link = link;
            const indexDto = new PageIndexQuery();
            indexDto.filter = filterDto;

            const pagesData = await pageProvider.index(indexDto);
            if (pagesData.length === 0) {
                throw { error: 'noRecords' };
            }

            const targetPage = await pageProvider.details(pagesData[0].id, [
                'pageParticipants',
                'pageFollows'
            ]);

            const owner = await userProvider.details(targetPage.userId);
            setOwnerUser(owner);
            setIsMyProfile(access.currentUser!.id === owner.id);

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

            fetchEventsData(targetPage.id);

            return targetPage;
        }, null as unknown as PageResponse);
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError) {
            fetchPageData();
        }
    }, [link, access.authLoading, access.authError]);

    useEffect(() => {
        if (pageObj) {
            fetchEventsData(pageObj.id);
        }
    }, [eventsList.page, eventsList.limit, eventsList.sort, eventsList.filters]);

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
            fetchPageData();
        } catch (err: any) {
            alert(err.error);
        } finally {
            setFollowLoading(false);
        }
    };

    const refreshPage = () => fetchPageData();

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
        loading: access.authLoading || pageLoading,
        error: access.authError || pageError,
        events: events || [],
        eventsLoading,
        eventPage: eventsList.page,
        eventLimit: eventsList.limit,
        eventSort: eventsList.sort,
        eventFilters: eventsList.filters,
        handleEventFilterChange: eventsList.handleFilterChange,
        handleEventSortChange: eventsList.handleSortChange,
        handleEventLimitChange: eventsList.handleLimitChange,
        handleEventPrevPage: eventsList.handlePrevPage,
        handleEventNextPage: eventsList.handleNextPage,
        refreshPage
    };
}