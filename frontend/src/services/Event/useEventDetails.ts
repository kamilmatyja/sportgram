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
import {StatusBody} from '../../api/body/StatusBody';
import {EventListFilterQuery} from '../../api/queries/EventListFilterQuery';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {fetchRelatedUsers} from '../../utils/fetchRelatedUsers';
import {useDataFetch} from '../../utils/hooks/useDataFetch';

export function useEventDetails(link?: string) {
    const access = useAppAccess();

    const { data: eventObj, loading: eventLoading, error: eventError, executeFetch: fetchEvent } = useDataFetch<EventResponse>();
    const { data: distanceLists, loading: listsLoading, executeFetch: fetchLists } = useDataFetch<EventDisciplineDistanceListResponse[]>();

    const [ownerPage, setOwnerPage] = useState<PageResponse | null>(null);
    const [userEnrollments, setUserEnrollments] = useState<string[]>([]);
    const [showListsModal, setShowListsModal] = useState(false);
    const [selectedDistanceId, setSelectedDistanceId] = useState<string>('');
    const [listUsers, setListUsers] = useState<Record<string, UserResponse>>({});
    const [actionLoading, setActionLoading] = useState(false);

    const eventProvider = new EventProvider();
    const pageProvider = new PageProvider();
    const userProvider = new UserProvider();

    const fetchEventData = () => {
        if (!link || !access.currentUser) return;

        fetchEvent(async () => {
            const filterDto = new EventFilterQuery();
            filterDto.link = link;
            const indexDto = new EventIndexQuery();
            indexDto.filter = filterDto;

            const events = await eventProvider.index(indexDto);
            if (events.length === 0) {
                throw { error: 'noRecords' };
            }

            const targetEvent = await eventProvider.details(events[0].id, [
                'eventDisciplines',
                'eventDisciplineDistances',
                'eventDisciplineSubDistances'
            ]);

            let targetPage = null;
            const pageFilterDto = new PageFilterQuery();
            pageFilterDto.userId = access.currentUser!.id;
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
                    if (lists.length > 0) enrollments.push(distId);
                }));
                setUserEnrollments(enrollments);
            }

            return targetEvent;
        }, null as unknown as EventResponse);
    };

    useEffect(() => {
        if (!access.authLoading && !access.authError) {
            fetchEventData();
        }
    }, [link, access.authLoading, access.authError]);

    const fetchDistanceLists = (distId: string) => {
        fetchLists(async () => {
            const indexQuery = new EventListIndexQuery();
            indexQuery.limit = 100;
            const lists = await eventProvider.indexList(distId, indexQuery);

            const detailedLists = await Promise.all(lists.map(async (l) => {
                return await eventProvider.detailsList(l.id, ['eventListResults', 'eventListSubResults']);
            }));

            const userIds = detailedLists.map(l => l.userId);
            const updatedUsers = await fetchRelatedUsers(userIds, listUsers, userProvider);
            setListUsers(updatedUsers);

            return detailedLists;
        }, []);
    };

    const openListsModal = (distId: string) => {
        setSelectedDistanceId(distId);
        setShowListsModal(true);
        fetchDistanceLists(distId);
    };

    const closeListsModal = () => {
        setShowListsModal(false);
        setSelectedDistanceId('');
    };

    const handleEnroll = async (distId: string) => {
        setActionLoading(true);
        try {
            await eventProvider.createList(distId);
            setUserEnrollments(prev => [...prev, distId]);
            if (selectedDistanceId === distId) {
                fetchDistanceLists(distId);
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
            fetchDistanceLists(selectedDistanceId);
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
            fetchDistanceLists(selectedDistanceId);
        } catch (err: any) {
            alert(err.error);
        } finally {
            setActionLoading(false);
        }
    };

    const refreshEvent = () => fetchEventData();

    return {
        ...access,
        eventObj,
        ownerPage,
        userEnrollments,
        isMyProfile: ownerPage !== null,
        loading: access.authLoading || eventLoading,
        error: access.authError || eventError,
        showListsModal,
        openListsModal,
        closeListsModal,
        selectedDistanceId,
        distanceLists: distanceLists || [],
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