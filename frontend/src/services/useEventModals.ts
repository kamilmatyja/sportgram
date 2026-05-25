import React, {useState} from 'react';
import {useTranslation} from '../context/TranslationContext';
import {EventProvider} from '../api/providers/EventProvider';
import {PageProvider} from '../api/providers/PageProvider';
import {EventBody} from '../api/body/EventBody';
import {StatusBody} from '../api/body/StatusBody';
import {EventResultBody} from '../api/body/EventResultBody';
import {EventResponse} from '../api/responses/EventResponse';
import {PageResponse} from '../api/responses/PageResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {EventDisciplineDistanceListResponse} from '../api/responses/EventDisciplineDistanceListResponse';
import {EventDiscipline} from '../api/body/EventDiscipline';
import {EventDistance} from '../api/body/EventDistance';
import {EventSubDistance} from '../api/body/EventSubDistance';
import {EventSubResult} from '../api/body/EventSubResult';
import {createFormHandler} from '../utils/formHandler';
import {PageIndexQuery} from '../api/queries/PageIndexQuery';
import {PageFilterQuery} from '../api/queries/PageFilterQuery';
import {EventListIndexQuery} from '../api/queries/EventListIndexQuery';
import {UserProvider} from '../api/providers/UserProvider';
import {UserIndexQuery} from '../api/queries/UserIndexQuery';
import {UserFilterQuery} from '../api/queries/UserFilterQuery';

export function useEventModals(onSuccess: () => void, currentUser: UserResponse | null) {
    const {t} = useTranslation();

    const [showAdd, setShowAdd] = useState(false);
    const [showManage, setShowManage] = useState(false);

    const [currentEvent, setCurrentEvent] = useState<EventResponse | null>(null);
    const [myPages, setMyPages] = useState<PageResponse[]>([]);
    const [selectedPageId, setSelectedPageId] = useState<string>('');

    const [selectedDistanceId, setSelectedDistanceId] = useState<string>('');
    const [distanceLists, setDistanceLists] = useState<EventDisciplineDistanceListResponse[]>([]);
    const [listUsers, setListUsers] = useState<Record<string, UserResponse>>({});
    const [loadingLists, setLoadingLists] = useState(false);

    const [activeResultListId, setActiveResultListId] = useState<string | null>(null);
    const [resultFormData, setResultFormData] = useState<EventResultBody>(new EventResultBody(0, []));
    const [activeResultId, setActiveResultId] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});

    const [formData, setFormData] = useState<EventBody>(new EventBody('', '', '', '', '', '', '', '', []));

    const eventProvider = new EventProvider();
    const pageProvider = new PageProvider();
    const userProvider = new UserProvider();

    const fetchMyPages = async () => {
        if (!currentUser) return;
        try {
            const filter = new PageFilterQuery();
            filter.userId = currentUser.id;
            const indexDto = new PageIndexQuery();
            indexDto.filter = filter;
            indexDto.limit = 100;
            const pages = await pageProvider.index(indexDto);
            setMyPages(pages);
        } catch (e) {
            console.error(e);
        }
    };

    const openAddModal = async () => {
        setFormData(new EventBody('', '', '', '', '', '', '', '', []));
        setSelectedPageId('');
        setGlobalError('');
        setFieldErrors({});
        await fetchMyPages();
        setShowAdd(true);
    };

    const closeAddModal = () => setShowAdd(false);

    const handleAddSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedPageId) {
            setGlobalError(t('selectPageForEvent'));
            return;
        }
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});
        try {
            await eventProvider.create(selectedPageId, formData);
            closeAddModal();
            onSuccess();
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const openManageModal = async (ev: EventResponse) => {
        setCurrentEvent(ev);
        const disciplinesMapped: EventDiscipline[] = ev.disciplines.map(d => ({
            discipline: d.discipline,
            distances: d.distances.map(dist => ({
                distance: dist.distance,
                subDistances: dist.subDistances.map(sub => ({
                    subDistance: sub.subDistance
                }))
            }))
        }));

        setFormData(new EventBody(
            ev.startedAt.substring(0, 16),
            ev.endedAt.substring(0, 16),
            ev.title,
            ev.description,
            ev.link,
            ev.rules,
            '',
            ev.location,
            disciplinesMapped
        ));

        setGlobalError('');
        setFieldErrors({});
        setSelectedDistanceId('');
        setDistanceLists([]);
        setActiveResultListId(null);
        setShowManage(true);
    };

    const closeManageModal = () => setShowManage(false);

    const handleEditSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!currentEvent) return;
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});
        try {
            formData.photo = formData.photo ? formData.photo : currentEvent.photo;
            await eventProvider.update(currentEvent.id, formData);
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusSubmit = async (newStatus: number) => {
        if (!currentEvent) return;
        setLoading(true);
        setGlobalError('');
        try {
            await eventProvider.updateStatus(currentEvent.id, new StatusBody(newStatus));
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!currentEvent) return;
        setLoading(true);
        setGlobalError('');
        try {
            await eventProvider.delete(currentEvent.id);
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
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

    const fetchDistanceLists = async (distanceId: string) => {
        setSelectedDistanceId(distanceId);
        setLoadingLists(true);
        setActiveResultListId(null);
        try {
            const indexQuery = new EventListIndexQuery();
            indexQuery.limit = 100;
            const lists = await eventProvider.indexList(distanceId, indexQuery);

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
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingLists(false);
        }
    };

    const handleListStatusSubmit = async (listId: string, status: number) => {
        setLoadingLists(true);
        try {
            await eventProvider.updateListStatus(listId, new StatusBody(status));
            await fetchDistanceLists(selectedDistanceId);
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoadingLists(false);
        }
    };

    const openAddResultForm = (list: EventDisciplineDistanceListResponse) => {
        const distanceObj = currentEvent?.disciplines.flatMap(d => d.distances).find(d => d.id === list.eventDisciplineDistanceId);
        const subRes: EventSubResult[] = distanceObj?.subDistances.map(sd => ({
            eventDisciplineSubDistanceId: sd.id,
            time: 0
        })) || [];

        setResultFormData(new EventResultBody(0, subRes));
        setActiveResultId(null);
        setActiveResultListId(list.id);
    };

    const openEditResultForm = (list: EventDisciplineDistanceListResponse, resultId: string) => {
        const resultObj = list.results?.find(r => r.id === resultId);
        if(!resultObj) return;

        const subRes: EventSubResult[] = resultObj.subResults?.map(sr => ({
            eventDisciplineSubDistanceId: sr.eventDisciplineSubDistanceId,
            time: sr.time
        })) || [];

        setResultFormData(new EventResultBody(resultObj.time, subRes));
        setActiveResultId(resultId);
        setActiveResultListId(list.id);
    };

    const handleSaveResult = async () => {
        if(!activeResultListId) return;
        setLoadingLists(true);
        setGlobalError('');
        try {
            if (activeResultId) {
                await eventProvider.updateResult(activeResultId, resultFormData);
            } else {
                await eventProvider.createResult(activeResultListId, resultFormData);
            }
            setActiveResultListId(null);
            await fetchDistanceLists(selectedDistanceId);
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoadingLists(false);
        }
    };

    const handleDeleteResult = async (resultId: string) => {
        setLoadingLists(true);
        try {
            await eventProvider.deleteResult(resultId);
            await fetchDistanceLists(selectedDistanceId);
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoadingLists(false);
        }
    };

    return {
        showAdd, openAddModal, closeAddModal, handleAddSubmit, myPages, selectedPageId, setSelectedPageId,
        showManage, openManageModal, closeManageModal, handleEditSubmit, handleStatusSubmit, handleDelete,
        currentEvent, formData, handleChange, loading, globalError, fieldErrors,
        addDiscipline, updateDisciplineType, removeDiscipline, addDistance, updateDistanceValue, removeDistance, addSubDistance, updateSubDistanceValue, removeSubDistance,
        selectedDistanceId, distanceLists, listUsers, loadingLists, fetchDistanceLists, handleListStatusUpdate: handleListStatusSubmit,
        activeResultListId, setActiveResultListId, resultFormData, setResultFormData, openAddResultForm, openEditResultForm, handleSaveResult, handleDeleteResult
    };
}