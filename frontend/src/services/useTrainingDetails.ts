import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {TrainingProvider} from '../api/providers/TrainingProvider';
import {UserProvider} from '../api/providers/UserProvider';
import {FriendProvider} from '../api/providers/FriendProvider';
import {TrainingBody} from '../api/body/TrainingBody';
import {StatusBody} from '../api/body/StatusBody';
import {TrainingResponse} from '../api/responses/TrainingResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {createFormHandler} from '../utils/formHandler';
import {useCheckPermission} from '../utils/checkPermission';
import {UserIndexQuery} from '../api/queries/UserIndexQuery';
import {FriendFilterQuery} from '../api/queries/FriendFilterQuery';
import {FriendIndexQuery} from '../api/queries/FriendIndexQuery';
import {FriendStatusEnum} from '../enums/FriendStatusEnum';
import {UserFilterQuery} from '../api/queries/UserFilterQuery';
import {TrainingFilterQuery} from '../api/queries/TrainingFilterQuery';
import {TrainingIndexQuery} from '../api/queries/TrainingIndexQuery';
import {RoleEnum} from '../enums/RoleEnum';
import {TrainingDiscipline} from '../api/body/TrainingDiscipline';
import {TrainingDistance} from '../api/body/TrainingDistance';
import {TrainingSubDistance} from '../api/body/TrainingSubDistance';

export function useTrainingDetails(link?: string) {
    const navigate = useNavigate();
    const {getCurrentUser} = useCheckPermission();

    const [training, setTraining] = useState<TrainingResponse | null>(null);
    const [ownerUser, setOwnerUser] = useState<UserResponse | null>(null);
    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [availableUsers, setAvailableUsers] = useState<UserResponse[]>([]);

    const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(true);
    const [submitLoading, setSubmitLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});
    const [successMsg, setSuccessMsg] = useState<string>('');

    const [formData, setFormData] = useState(new TrainingBody('', '', '', '', '', '', [], []));

    const trainingProvider = new TrainingProvider();
    const userProvider = new UserProvider();
    const friendProvider = new FriendProvider();

    const loadAvailableFriends = async (currentUsr: UserResponse) => {
        const fFilter = new FriendFilterQuery();
        fFilter.userIds = [currentUsr.id];
        fFilter.status = FriendStatusEnum.ACCEPTED;
        const fIndexDto = new FriendIndexQuery();
        fIndexDto.filter = fFilter;

        const myFriends = await friendProvider.index(fIndexDto);

        const acceptedFriendIds = new Set<string>();
        myFriends.forEach(f => {
            if (f.senderUserId !== currentUsr.id) acceptedFriendIds.add(f.senderUserId);
            if (f.receiverUserId !== currentUsr.id) acceptedFriendIds.add(f.receiverUserId);
        });

        if (acceptedFriendIds.size > 0) {
            const uFilter = new UserFilterQuery();
            uFilter.userIds = Array.from(acceptedFriendIds);
            const uIndexDto = new UserIndexQuery();
            uIndexDto.filter = uFilter;
            const acceptedFriendsUsers = await userProvider.index(uIndexDto);
            setAvailableUsers(acceptedFriendsUsers);
        } else {
            setAvailableUsers([]);
        }
    };

    const fetchTrainingData = async () => {
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

            const filterDto = new TrainingFilterQuery();
            filterDto.link = link;
            const indexDto = new TrainingIndexQuery();
            indexDto.filter = filterDto;

            const trainings = await trainingProvider.index(indexDto);

            if (trainings.length === 0) {
                setError('noTrainings');
                return;
            }

            const targetTraining = await trainingProvider.details(trainings[0].id, [
                'trainingDisciplines',
                'trainingDisciplineDistances',
                'trainingDisciplineSubDistances',
                'trainingParticipants'
            ]);

            setTraining(targetTraining);

            const owner = await userProvider.details(targetTraining.userId);
            setOwnerUser(owner);

            const isOwner = currentUsr.id === owner.id;
            setIsMyProfile(isOwner);

            const disciplinesMapped: TrainingDiscipline[] = targetTraining.disciplines.map(d => ({
                discipline: d.discipline,
                distances: d.distances.map(dist => ({
                    distance: dist.distance,
                    time: dist.time,
                    subDistances: dist.subDistances.map(sub => ({
                        subDistance: sub.subDistance,
                        time: sub.time,
                        lat: sub.lat,
                        lng: sub.lng,
                        accuracy: sub.accuracy,
                        speed: sub.speed
                    }))
                }))
            }));

            setFormData(new TrainingBody(
                targetTraining.startedAt.substring(0, 16),
                targetTraining.endedAt.substring(0, 16),
                targetTraining.title,
                targetTraining.description,
                targetTraining.link,
                targetTraining.location,
                disciplinesMapped,
                targetTraining.participants.map(p => p.userId)
            ));

            if (isOwner || adminCheck) {
                await loadAvailableFriends(owner);
            }

        } catch (err: any) {
            setError(err.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrainingData();
    }, [link]);

    const handleEditSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!training) return;
        setSubmitLoading(true);
        setGlobalError('');
        setFieldErrors({});
        setSuccessMsg('');
        try {
            await trainingProvider.update(training.id, formData);
            setSuccessMsg('settingsUpdated');
            await fetchTrainingData();
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleStatusSubmit = async (newStatus: number) => {
        if (!training) return;
        setSubmitLoading(true);
        setGlobalError('');
        setSuccessMsg('');
        try {
            await trainingProvider.updateStatus(training.id, new StatusBody(newStatus));
            await fetchTrainingData();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleParticipantStatusSubmit = async (participantId: string, newStatus: number) => {
        setSubmitLoading(true);
        setGlobalError('');
        setSuccessMsg('');
        try {
            await trainingProvider.updateParticipantStatus(participantId, new StatusBody(newStatus));
            await fetchTrainingData();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!training || !ownerUser) return;
        setSubmitLoading(true);
        setGlobalError('');
        try {
            await trainingProvider.delete(training.id);
            navigate(`/users/${ownerUser.link}/trainings`);
        } catch (err: any) {
            setGlobalError(err.error);
            setSubmitLoading(false);
        }
    };

    const handleChange = createFormHandler(setFormData);

    const handleParticipantsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions).map(o => o.value);
        setFormData(prev => ({ ...prev, participants: selected }));
    };

    const addDiscipline = () => {
        const newDisc = new TrainingDiscipline();
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
        const newDist = new TrainingDistance();
        newDist.distance = 0;
        newDist.time = 0;
        newDist.subDistances = [];
        discs[discIndex].distances = [...(discs[discIndex].distances || []), newDist];
        setFormData(prev => ({ ...prev, disciplines: discs }));
    };

    const updateDistanceValue = (discIndex: number, distIndex: number, field: keyof TrainingDistance, val: number) => {
        const discs = [...(formData.disciplines || [])];
        (discs[discIndex].distances![distIndex] as any)[field] = val;
        setFormData(prev => ({ ...prev, disciplines: discs }));
    };

    const removeDistance = (discIndex: number, distIndex: number) => {
        const discs = [...(formData.disciplines || [])];
        discs[discIndex].distances!.splice(distIndex, 1);
        setFormData(prev => ({ ...prev, disciplines: discs }));
    };

    const addSubDistance = (discIndex: number, distIndex: number) => {
        const discs = [...(formData.disciplines || [])];
        const newSub = new TrainingSubDistance();
        newSub.subDistance = 0;
        newSub.time = 0;
        discs[discIndex].distances![distIndex].subDistances = [...(discs[discIndex].distances![distIndex].subDistances || []), newSub];
        setFormData(prev => ({ ...prev, disciplines: discs }));
    };

    const updateSubDistanceValue = (discIndex: number, distIndex: number, subIndex: number, field: keyof TrainingSubDistance, val: number) => {
        const discs = [...(formData.disciplines || [])];
        (discs[discIndex].distances![distIndex].subDistances![subIndex] as any)[field] = val;
        setFormData(prev => ({ ...prev, disciplines: discs }));
    };

    const removeSubDistance = (discIndex: number, distIndex: number, subIndex: number) => {
        const discs = [...(formData.disciplines || [])];
        discs[discIndex].distances![distIndex].subDistances!.splice(subIndex, 1);
        setFormData(prev => ({ ...prev, disciplines: discs }));
    };

    return {
        training,
        ownerUser,
        currentUser,
        availableUsers,
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
        handleParticipantsChange,
        handleEditSubmit,
        handleStatusSubmit,
        handleParticipantStatusSubmit,
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