import {useEffect, useState} from 'react';
import {EventProvider} from '../../api/providers/EventProvider';
import {PageProvider} from '../../api/providers/PageProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {EventResponse} from '../../api/responses/EventResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {PageResponse} from '../../api/responses/PageResponse';
import {EventDisciplineDistanceListResponse} from '../../api/responses/EventDisciplineDistanceListResponse';
import {useCheckPermission} from '../../utils/checkPermission';
import {EventFilterQuery} from '../../api/queries/EventFilterQuery';
import {EventIndexQuery} from '../../api/queries/EventIndexQuery';
import {PageFilterQuery} from '../../api/queries/PageFilterQuery';
import {PageIndexQuery} from '../../api/queries/PageIndexQuery';
import {EventListIndexQuery} from '../../api/queries/EventListIndexQuery';
import {UserFilterQuery} from '../../api/queries/UserFilterQuery';
import {UserIndexQuery} from '../../api/queries/UserIndexQuery';
import {RoleEnum} from '../../enums/RoleEnum';
import {StatusBody} from '../../api/body/StatusBody';
import {EventListFilterQuery} from '../../api/queries/EventListFilterQuery';

export function useEventDetails(link?: string) {
    const {getCurrentUser} = useCheckPermission();

    const [eventObj, setEventObj] = useState<EventResponse | null>(null);
    const [ownerPage, setOwnerPage] = useState<PageResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);

    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isParticipant, setIsParticipant] = useState<boolean>(false);
    const [userEnrollments, setUserEnrollments] = useState<string[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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

            const participantCheck = currentUsr.roles?.some((r: any) => r.role === RoleEnum.PARTICIPANT) ?? false;
            setIsParticipant(participantCheck);

            const filterDto = new EventFilterQuery();
            filterDto.link = link;
            const indexDto = new EventIndexQuery();
            indexDto.filter = filterDto;

            const events = await eventProvider.index(indexDto);

            if (events.length === 0) {
                setError('noEvents');
                return;
            }

            const targetEvent = await eventProvider.details(events[0].id, [
                'eventDisciplines',
                'eventDisciplineDistances',
                'eventDisciplineSubDistances'
            ]);

            setEventObj(targetEvent);

            let isOwner = false;
            let targetPage = null;

            const pageFilterDto = new PageFilterQuery();
            pageFilterDto.userId = currentUsr.id;
            const pageIndexDto = new PageIndexQuery();
            pageIndexDto.filter = pageFilterDto;
            pageIndexDto.limit = 100;

            const myPages = await pageProvider.index(pageIndexDto);

            for (const p of myPages) {
                const pDetails = await pageProvider.details(p.id, ['pageParticipants']);
                if (pDetails.participants?.some(part => part.id === targetEvent.pageParticipantId)) {
                    isOwner = true;
                    targetPage = pDetails;
                    break;
                }
            }

            setIsMyProfile(isOwner);
            setOwnerPage(targetPage);

            if (participantCheck) {
                const enrollments: string[] = [];
                const distIds = targetEvent.disciplines.flatMap(d => d.distances.map(dist => dist.id));
                await Promise.all(distIds.map(async (distId) => {
                    const lFilter = new EventListFilterQuery();
                    lFilter.userId = currentUsr.id;
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
            setError(err.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEventData();
    }, [link]);

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

    return {
        eventObj,
        ownerPage,
        currentUser,
        isMyProfile,
        isAdmin,
        isParticipant,
        userEnrollments,
        loading,
        error,
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