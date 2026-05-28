import {useEffect, useState} from 'react';
import {EventProvider} from '../../api/providers/EventProvider';
import {PageProvider} from '../../api/providers/PageProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {EventResponse} from '../../api/responses/EventResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {PageResponse} from '../../api/responses/PageResponse';
import {EventDisciplineDistanceListResponse} from '../../api/responses/EventDisciplineDistanceListResponse';
import {EventFilterQuery} from '../../api/queries/EventFilterQuery';
import {EventIndexQuery} from '../../api/queries/EventIndexQuery';
import {PageFilterQuery} from '../../api/queries/PageFilterQuery';
import {PageIndexQuery} from '../../api/queries/PageIndexQuery';
import {EventListIndexQuery} from '../../api/queries/EventListIndexQuery';
import {UserFilterQuery} from '../../api/queries/UserFilterQuery';
import {UserIndexQuery} from '../../api/queries/UserIndexQuery';
import {StatusBody} from '../../api/body/StatusBody';
import {EventListFilterQuery} from '../../api/queries/EventListFilterQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';

export function useEventDetails(link?: string) {
    const access = useAppAccess();
    const [eventObj, setEventObj] = useState<EventResponse | null>(null);
    const [ownerPage, setOwnerPage] = useState<PageResponse | null>(null);
    const [userEnrollments, setUserEnrollments] = useState<string[]>([]);

    const [dataLoading, setDataLoading] = useState<boolean>(true);
    const [dataError, setDataError] = useState<string | null>(null);

    const [showListsModal, setShowListsModal] = useState(false);
    const [selectedDistanceId, setSelectedDistanceId] = useState<string>('');
    const [distanceLists, setDistanceLists] = useState<EventDisciplineDistanceListResponse[]>([]);
    const [listUsers, setListUsers] = useState<Record<string, UserResponse>>({});
    const [listsLoading, setListsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const eventProvider = new EventProvider();
    const pageProvider = new PageProvider();
    const userProvider = new UserProvider();

    const fetchEventData = async () => {
        if (!link || !access.currentUser) return;

        setDataLoading(true);
        setDataError(null);

        try {
            const filterDto = new EventFilterQuery();
            filterDto.link = link;
            const indexDto = new EventIndexQuery();
            indexDto.filter = filterDto;

            const events = await eventProvider.index(indexDto);

            if (events.length === 0) {
                setDataError('noEvents');
                return;
            }

            const targetEvent = await eventProvider.details(events[0].id, [
                'eventDisciplines',
                'eventDisciplineDistances',
                'eventDisciplineSubDistances'
            ]);

            setEventObj(targetEvent);

            let targetPage = null;

            const pageFilterDto = new PageFilterQuery();
            pageFilterDto.userId = access.currentUser.id;
            const pageIndexDto = new PageIndexQuery();
            pageIndexDto.filter = pageFilterDto;
            pageIndexDto.limit = 100;

            const myPages = await pageProvider.index(pageIndexDto);

            for (const p of myPages) {
                const pDetails = await pageProvider.details(p.id, ['pageParticipants']);
                if (pDetails.participants?.some(part => part.id === targetEvent.pageParticipantId)) {
                    targetPage = pDetails;
                    break;
                }
            }

            setOwnerPage(targetPage);

            if (access.isParticipant) {
                const enrollments: string[] = [];
                const distIds = targetEvent.disciplines.flatMap(d => d.distances.map(dist => dist.id));
                await Promise.all(distIds.map(async (distId) => {
                    const lFilter = new EventListFilterQuery();
                    lFilter.userId = access.currentUser!.id;
                    const lIndex = new EventListIndexQuery();
                    lIndex.filter = lFilter;
                    const lists = await eventProvider.indexList(distId, lIndex);
                    if (lists.length > 0) {
                        enrollments.push(distId);
                    }
                }));
                setUserEnrollments(enrollments);
            }

        } catch (err: any) {
            setDataError(err.error);
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError) {
            fetchEventData();
        }
    }, [link, access.authLoading, access.authError]);

    const fetchDistanceLists = async (distId: string) => {
        setListsLoading(true);
        try {
            const indexQuery = new EventListIndexQuery();
            indexQuery.limit = 100;
            const lists = await eventProvider.indexList(distId, indexQuery);

            const detailedLists = await Promise.all(lists.map(async (l) => {
                return await eventProvider.detailsList(l.id, ['eventListResults', 'eventListSubResults']);
            }));

            setDistanceLists(detailedLists);

            const userIds = Array.from(new Set(detailedLists.map(l => l.userId)));
            if (userIds.length > 0) {
                const uq = new UserIndexQuery();
                uq.limit = userIds.length;
                const uf = new UserFilterQuery();
                uf.userIds = userIds;
                uq.filter = uf;
                const users = await userProvider.index(uq);
                const map: Record<string, UserResponse> = {};
                users.forEach(u => map[u.id] = u);
                setListUsers(map);
            } else {
                setListUsers({});
            }
        } catch (e) {
            console.error(e);
        } finally {
            setListsLoading(false);
        }
    };

    const openListsModal = (distId: string) => {
        setSelectedDistanceId(distId);
        setShowListsModal(true);
        fetchDistanceLists(distId);
    };

    const closeListsModal = () => {
        setShowListsModal(false);
        setSelectedDistanceId('');
        setDistanceLists([]);
    };

    const handleEnroll = async (distId: string) => {
        setActionLoading(true);
        try {
            await eventProvider.createList(distId);
            setUserEnrollments(prev => [...prev, distId]);
            if (selectedDistanceId === distId) {
                await fetchDistanceLists(distId);
            }
        } catch (e: any) {
            alert(e.error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleListStatusUpdate = async (listId: string, status: number) => {
        setActionLoading(true);
        try {
            await eventProvider.updateListStatus(listId, new StatusBody(status));
            await fetchDistanceLists(selectedDistanceId);
        } catch (err: any) {
            alert(err.error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteList = async (listId: string) => {
        setActionLoading(true);
        try {
            await eventProvider.deleteList(listId);
            await fetchDistanceLists(selectedDistanceId);
        } catch (err: any) {
            alert(err.error);
        } finally {
            setActionLoading(false);
        }
    };

    const refreshEvent = () => {
        fetchEventData();
    };

    const isMyProfileResolved = ownerPage !== null;

    return {
        ...access,
        eventObj,
        ownerPage,
        userEnrollments,
        isMyProfile: isMyProfileResolved,
        loading: access.authLoading || dataLoading,
        error: access.authError || dataError,
        showListsModal,
        openListsModal,
        closeListsModal,
        selectedDistanceId,
        distanceLists,
        listUsers,
        listsLoading,
        actionLoading,
        handleEnroll,
        handleListStatusUpdate,
        handleDeleteList,
        refreshEvent,
        refreshLists: fetchDistanceLists
    };
}