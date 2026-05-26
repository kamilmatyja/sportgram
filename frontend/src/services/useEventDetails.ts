import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {EventProvider} from '../api/providers/EventProvider';
import {PageProvider} from '../api/providers/PageProvider';
import {UserProvider} from '../api/providers/UserProvider';
import {EventBody} from '../api/body/EventBody';
import {StatusBody} from '../api/body/StatusBody';
import {EventResponse} from '../api/responses/EventResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {PageResponse} from '../api/responses/PageResponse';
import {EventDisciplineDistanceListResponse} from '../api/responses/EventDisciplineDistanceListResponse';
import {createFormHandler} from '../utils/formHandler';
import {useCheckPermission} from '../utils/checkPermission';
import {EventFilterQuery} from '../api/queries/EventFilterQuery';
import {EventIndexQuery} from '../api/queries/EventIndexQuery';
import {PageFilterQuery} from '../api/queries/PageFilterQuery';
import {PageIndexQuery} from '../api/queries/PageIndexQuery';
import {EventListIndexQuery} from '../api/queries/EventListIndexQuery';
import {UserFilterQuery} from '../api/queries/UserFilterQuery';
import {UserIndexQuery} from '../api/queries/UserIndexQuery';
import {RoleEnum} from '../enums/RoleEnum';
import {EventDiscipline} from '../api/body/EventDiscipline';
import {EventDistance} from '../api/body/EventDistance';
import {EventSubDistance} from '../api/body/EventSubDistance';

export function useEventDetails(link?: string) {
    const navigate = useNavigate();
    const {getCurrentUser} = useCheckPermission();

    const [eventObj, setEventObj] = useState<EventResponse | null>(null);
    const [ownerPage, setOwnerPage] = useState<PageResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);

    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isParticipant, setIsParticipant] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(true);
    const [submitLoading, setSubmitLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});
    const [successMsg, setSuccessMsg] = useState<string>('');

    const [formData, setFormData] = useState(new EventBody('', '', '', '', '', '', '', '', []));

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

            const disciplinesMapped: EventDiscipline[] = targetEvent.disciplines.map(d => ({
                discipline: d.discipline,
                distances: d.distances.map(dist => ({
                    distance: dist.distance,
                    subDistances: dist.subDistances.map(sub => ({
                        subDistance: sub.subDistance
                    }))
                }))
            }));

            setFormData(new EventBody(
                targetEvent.startedAt.substring(0, 16),
                targetEvent.endedAt.substring(0, 16),
                targetEvent.title,
                targetEvent.description,
                targetEvent.link,
                targetEvent.rules,
                '',
                targetEvent.location,
                disciplinesMapped
            ));

        } catch (err: any) {
            setError(err.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEventData();
    }, [link]);

    const handleEditSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!eventObj) return;
        setSubmitLoading(true);
        setGlobalError('');
        setFieldErrors({});
        setSuccessMsg('');
        try {
            formData.photo = formData.photo ? formData.photo : eventObj.photo;
            await eventProvider.update(eventObj.id, formData);
            setSuccessMsg('settingsUpdated');
            await fetchEventData();
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleStatusSubmit = async (newStatus: number) => {
        if (!eventObj) return;
        setSubmitLoading(true);
        setGlobalError('');
        setSuccessMsg('');
        try {
            await eventProvider.updateStatus(eventObj.id, new StatusBody(newStatus));
            await fetchEventData();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!eventObj) return;
        setSubmitLoading(true);
        setGlobalError('');
        try {
            await eventProvider.delete(eventObj.id);
            navigate(`/events`);
        } catch (err: any) {
            setGlobalError(err.error);
            setSubmitLoading(false);
        }
    };

    const addDiscipline = () => {
        const newDisc = new EventDiscipline();
        newDisc.discipline = 1;
        newDisc.distances = [];
        setFormData(prev => ({ ...prev, disciplines: [...(prev.disciplines || []), newDisc] }));
    };

    const updateDisciplineType = (index: number, type: number) => {
        const discs = [...(formData.disciplines || [])];
        discs[index].discipline = type;
        setFormData(prev => ({ ...prev, disciplines: discs }));
    };

    const removeDiscipline = (index: number) => {
        const discs = [...(formData.disciplines || [])];
        discs.splice(index, 1);
        setFormData(prev => ({ ...prev, disciplines: discs }));
    };

    const addDistance = (discIndex: number) => {
        const discs = [...(formData.disciplines || [])];
        const newDist = new EventDistance();
        newDist.distance = 0;
        newDist.subDistances = [];
        discs[discIndex].distances = [...(discs[discIndex].distances || []), newDist];
        setFormData(prev => ({ ...prev, disciplines: discs }));
    };

    const updateDistanceValue = (discIndex: number, distIndex: number, val: number) => {
        const discs = [...(formData.disciplines || [])];
        discs[discIndex].distances![distIndex].distance = val;
        setFormData(prev => ({ ...prev, disciplines: discs }));
    };

    const removeDistance = (discIndex: number, distIndex: number) => {
        const discs = [...(formData.disciplines || [])];
        discs[discIndex].distances!.splice(distIndex, 1);
        setFormData(prev => ({ ...prev, disciplines: discs }));
    };

    const addSubDistance = (discIndex: number, distIndex: number) => {
        const discs = [...(formData.disciplines || [])];
        const newSub = new EventSubDistance();
        newSub.subDistance = 0;
        discs[discIndex].distances![distIndex].subDistances = [...(discs[discIndex].distances![distIndex].subDistances || []), newSub];
        setFormData(prev => ({ ...prev, disciplines: discs }));
    };

    const updateSubDistanceValue = (discIndex: number, distIndex: number, subIndex: number, val: number) => {
        const discs = [...(formData.disciplines || [])];
        discs[discIndex].distances![distIndex].subDistances![subIndex].subDistance = val;
        setFormData(prev => ({ ...prev, disciplines: discs }));
    };

    const removeSubDistance = (discIndex: number, distIndex: number, subIndex: number) => {
        const discs = [...(formData.disciplines || [])];
        discs[discIndex].distances![distIndex].subDistances!.splice(subIndex, 1);
        setFormData(prev => ({ ...prev, disciplines: discs }));
    };

    const handleChange = createFormHandler(setFormData);

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

    const handleEnroll = async () => {
        if (!selectedDistanceId) return;
        setActionLoading(true);
        try {
            await eventProvider.createList(selectedDistanceId);
            await fetchDistanceLists(selectedDistanceId);
        } catch(e: any) {
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

    return {
        eventObj,
        ownerPage,
        currentUser,
        isMyProfile,
        isAdmin,
        isParticipant,
        loading,
        submitLoading,
        error,
        globalError,
        fieldErrors,
        successMsg,
        formData,
        handleChange,
        handleEditSubmit,
        handleStatusSubmit,
        handleDelete,
        addDiscipline,
        updateDisciplineType,
        removeDiscipline,
        addDistance,
        updateDistanceValue,
        removeDistance,
        addSubDistance,
        updateSubDistanceValue,
        removeSubDistance,
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
        handleDeleteList
    };
}