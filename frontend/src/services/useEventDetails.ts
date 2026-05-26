import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {EventProvider} from '../api/providers/EventProvider';
import {PageProvider} from '../api/providers/PageProvider';
import {EventBody} from '../api/body/EventBody';
import {StatusBody} from '../api/body/StatusBody';
import {EventResponse} from '../api/responses/EventResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {PageResponse} from '../api/responses/PageResponse';
import {createFormHandler} from '../utils/formHandler';
import {useCheckPermission} from '../utils/checkPermission';
import {EventFilterQuery} from '../api/queries/EventFilterQuery';
import {EventIndexQuery} from '../api/queries/EventIndexQuery';
import {PageFilterQuery} from '../api/queries/PageFilterQuery';
import {PageIndexQuery} from '../api/queries/PageIndexQuery';
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

    const [loading, setLoading] = useState<boolean>(true);
    const [submitLoading, setSubmitLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});
    const [successMsg, setSuccessMsg] = useState<string>('');

    const [formData, setFormData] = useState(new EventBody('', '', '', '', '', '', '', '', []));

    const eventProvider = new EventProvider();
    const pageProvider = new PageProvider();

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

    return {
        eventObj,
        ownerPage,
        currentUser,
        isMyProfile,
        isAdmin,
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
        removeSubDistance
    };
}