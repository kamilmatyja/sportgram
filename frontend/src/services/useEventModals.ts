import React, {useState} from 'react';
import {useTranslation} from '../context/TranslationContext';
import {EventProvider} from '../api/providers/EventProvider';
import {PageProvider} from '../api/providers/PageProvider';
import {EventBody} from '../api/body/EventBody';
import {StatusBody} from '../api/body/StatusBody';
import {EventResponse} from '../api/responses/EventResponse';
import {PageResponse} from '../api/responses/PageResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {EventDiscipline} from '../api/body/EventDiscipline';
import {EventDistance} from '../api/body/EventDistance';
import {EventSubDistance} from '../api/body/EventSubDistance';
import {createFormHandler} from '../utils/formHandler';
import {PageIndexQuery} from '../api/queries/PageIndexQuery';
import {PageFilterQuery} from '../api/queries/PageFilterQuery';

export function useEventModals(onSuccess: () => void, currentUser: UserResponse | null) {
    const {t} = useTranslation();

    const [showAdd, setShowAdd] = useState(false);
    const [showManage, setShowManage] = useState(false);

    const [currentEvent, setCurrentEvent] = useState<EventResponse | null>(null);
    const [myPages, setMyPages] = useState<PageResponse[]>([]);
    const [selectedPageId, setSelectedPageId] = useState<string>('');

    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});

    const [formData, setFormData] = useState<EventBody>(new EventBody('', '', '', '', '', '', '', '', []));

    const eventProvider = new EventProvider();
    const pageProvider = new PageProvider();

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
        setFormData(prev => ({...prev, disciplines: [...(prev.disciplines || []), newDisc]}));
    };

    const updateDisciplineType = (index: number, type: number) => {
        const discs = [...(formData.disciplines || [])];
        discs[index].discipline = type;
        setFormData(prev => ({...prev, disciplines: discs}));
    };

    const removeDiscipline = (index: number) => {
        const discs = [...(formData.disciplines || [])];
        discs.splice(index, 1);
        setFormData(prev => ({...prev, disciplines: discs}));
    };

    const addDistance = (discIndex: number) => {
        const discs = [...(formData.disciplines || [])];
        const newDist = new EventDistance();
        newDist.distance = 0;
        newDist.subDistances = [];
        discs[discIndex].distances = [...(discs[discIndex].distances || []), newDist];
        setFormData(prev => ({...prev, disciplines: discs}));
    };

    const updateDistanceValue = (discIndex: number, distIndex: number, val: number) => {
        const discs = [...(formData.disciplines || [])];
        discs[discIndex].distances![distIndex].distance = val;
        setFormData(prev => ({...prev, disciplines: discs}));
    };

    const removeDistance = (discIndex: number, distIndex: number) => {
        const discs = [...(formData.disciplines || [])];
        discs[discIndex].distances!.splice(distIndex, 1);
        setFormData(prev => ({...prev, disciplines: discs}));
    };

    const addSubDistance = (discIndex: number, distIndex: number) => {
        const discs = [...(formData.disciplines || [])];
        const newSub = new EventSubDistance();
        newSub.subDistance = 0;
        discs[discIndex].distances![distIndex].subDistances = [...(discs[discIndex].distances![distIndex].subDistances || []), newSub];
        setFormData(prev => ({...prev, disciplines: discs}));
    };

    const updateSubDistanceValue = (discIndex: number, distIndex: number, subIndex: number, val: number) => {
        const discs = [...(formData.disciplines || [])];
        discs[discIndex].distances![distIndex].subDistances![subIndex].subDistance = val;
        setFormData(prev => ({...prev, disciplines: discs}));
    };

    const removeSubDistance = (discIndex: number, distIndex: number, subIndex: number) => {
        const discs = [...(formData.disciplines || [])];
        discs[discIndex].distances![distIndex].subDistances!.splice(subIndex, 1);
        setFormData(prev => ({...prev, disciplines: discs}));
    };

    const handleChange = createFormHandler(setFormData);

    return {
        showAdd, openAddModal, closeAddModal, handleAddSubmit,
        myPages, selectedPageId, setSelectedPageId,
        showManage, openManageModal, closeManageModal, handleEditSubmit, handleStatusSubmit, handleDelete,
        currentEvent, formData, handleChange, loading, globalError, fieldErrors,
        addDiscipline, updateDisciplineType, removeDiscipline, addDistance, updateDistanceValue, removeDistance,
        addSubDistance, updateSubDistanceValue, removeSubDistance
    };
}