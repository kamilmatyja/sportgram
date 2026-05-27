import React, {useState} from 'react';
import {TrainingProvider} from '../api/providers/TrainingProvider';
import {UserProvider} from '../api/providers/UserProvider';
import {FriendProvider} from '../api/providers/FriendProvider';
import {TrainingBody} from '../api/body/TrainingBody';
import {StatusBody} from '../api/body/StatusBody';
import {TrainingResponse} from '../api/responses/TrainingResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {createFormHandler} from '../utils/formHandler';
import {useCheckPermission} from '../utils/checkPermission';
import {FriendFilterQuery} from '../api/queries/FriendFilterQuery';
import {FriendIndexQuery} from '../api/queries/FriendIndexQuery';
import {FriendStatusEnum} from '../enums/FriendStatusEnum';
import {UserFilterQuery} from '../api/queries/UserFilterQuery';
import {UserIndexQuery} from '../api/queries/UserIndexQuery';
import {TrainingDiscipline} from '../api/body/TrainingDiscipline';
import {TrainingDistance} from '../api/body/TrainingDistance';
import {TrainingSubDistance} from '../api/body/TrainingSubDistance';

export function useTrainingModals(onSuccess: () => void) {
    const [showAdd, setShowAdd] = useState(false);
    const [showManage, setShowManage] = useState(false);

    const [currentTraining, setCurrentTraining] = useState<TrainingResponse | null>(null);
    const [availableUsers, setAvailableUsers] = useState<UserResponse[]>([]);

    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});

    const [formData, setFormData] = useState<TrainingBody>(new TrainingBody('', '', '', '', '', '', [], []));

    const trainingProvider = new TrainingProvider();
    const userProvider = new UserProvider();
    const friendProvider = new FriendProvider();
    const {getCurrentUser} = useCheckPermission();

    const loadAvailableFriends = async (currentUser: UserResponse) => {
        const fFilter = new FriendFilterQuery();
        fFilter.userIds = [currentUser.id];
        fFilter.status = FriendStatusEnum.ACCEPTED;
        const fIndexDto = new FriendIndexQuery();
        fIndexDto.filter = fFilter;

        const myFriends = await friendProvider.index(fIndexDto);
        const acceptedFriendIds = new Set<string>();
        myFriends.forEach(f => {
            if (f.senderUserId !== currentUser.id) acceptedFriendIds.add(f.senderUserId);
            if (f.receiverUserId !== currentUser.id) acceptedFriendIds.add(f.receiverUserId);
        });

        if (acceptedFriendIds.size > 0) {
            const uFilter = new UserFilterQuery();
            uFilter.userIds = Array.from(acceptedFriendIds);
            const uIndexDto = new UserIndexQuery();
            uIndexDto.filter = uFilter;
            uIndexDto.limit = acceptedFriendIds.size;
            const acceptedFriendsUsers = await userProvider.index(uIndexDto);
            setAvailableUsers(acceptedFriendsUsers);
        } else {
            setAvailableUsers([]);
        }
    };

    const openAddModal = async () => {
        setFormData(new TrainingBody('', '', '', '', '', '', [], []));
        setGlobalError('');
        setFieldErrors({});
        setLoading(true);

        try {
            const currentUser = await getCurrentUser();
            if (currentUser) await loadAvailableFriends(currentUser);
        } catch (e: any) {
            setGlobalError(e.error);
        } finally {
            setLoading(false);
            setShowAdd(true);
        }
    };

    const closeAddModal = () => setShowAdd(false);

    const handleAddSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});
        try {
            await trainingProvider.create(formData);
            closeAddModal();
            onSuccess();
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const openManageModal = async (tr: TrainingResponse) => {
        setCurrentTraining(tr);

        const disciplinesMapped: TrainingDiscipline[] = tr.disciplines.map(d => ({
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
            tr.startedAt.substring(0, 16),
            tr.endedAt.substring(0, 16),
            tr.title,
            tr.description,
            tr.link,
            tr.location,
            disciplinesMapped,
            tr.participants.map(p => p.userId)
        ));

        setGlobalError('');
        setFieldErrors({});
        setLoading(true);

        try {
            const currentUser = await getCurrentUser();
            if (currentUser) await loadAvailableFriends(currentUser);
        } catch (e: any) {
            setGlobalError(e.error);
        } finally {
            setLoading(false);
            setShowManage(true);
        }
    };

    const closeManageModal = () => setShowManage(false);

    const handleEditSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!currentTraining) return;
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});
        try {
            await trainingProvider.update(currentTraining.id, formData);
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
        if (!currentTraining) return;
        setLoading(true);
        setGlobalError('');
        try {
            await trainingProvider.updateStatus(currentTraining.id, new StatusBody(newStatus));
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!currentTraining) return;
        setLoading(true);
        setGlobalError('');
        try {
            await trainingProvider.delete(currentTraining.id);
            closeManageModal();
            onSuccess();
        } catch (err: any) {
            setGlobalError(err.error);
        } finally {
            setLoading(false);
        }
    };

    const addDiscipline = () => {
        const newDisc = new TrainingDiscipline();
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
        const newDist = new TrainingDistance();
        newDist.distance = 0;
        newDist.time = 0;
        newDist.subDistances = [];
        discs[discIndex].distances = [...(discs[discIndex].distances || []), newDist];
        setFormData(prev => ({...prev, disciplines: discs}));
    };

    const updateDistanceValue = (discIndex: number, distIndex: number, field: keyof TrainingDistance, val: number) => {
        const discs = [...(formData.disciplines || [])];
        (discs[discIndex].distances![distIndex] as any)[field] = val;
        setFormData(prev => ({...prev, disciplines: discs}));
    };

    const removeDistance = (discIndex: number, distIndex: number) => {
        const discs = [...(formData.disciplines || [])];
        discs[discIndex].distances!.splice(distIndex, 1);
        setFormData(prev => ({...prev, disciplines: discs}));
    };

    const addSubDistance = (discIndex: number, distIndex: number) => {
        const discs = [...(formData.disciplines || [])];
        const newSub = new TrainingSubDistance();
        newSub.subDistance = 0;
        newSub.time = 0;
        discs[discIndex].distances![distIndex].subDistances = [...(discs[discIndex].distances![distIndex].subDistances || []), newSub];
        setFormData(prev => ({...prev, disciplines: discs}));
    };

    const updateSubDistanceValue = (discIndex: number, distIndex: number, subIndex: number, field: keyof TrainingSubDistance, val: number) => {
        const discs = [...(formData.disciplines || [])];
        (discs[discIndex].distances![distIndex].subDistances![subIndex] as any)[field] = val;
        setFormData(prev => ({...prev, disciplines: discs}));
    };

    const removeSubDistance = (discIndex: number, distIndex: number, subIndex: number) => {
        const discs = [...(formData.disciplines || [])];
        discs[discIndex].distances![distIndex].subDistances!.splice(subIndex, 1);
        setFormData(prev => ({...prev, disciplines: discs}));
    };

    const handleChange = createFormHandler(setFormData);

    const handleParticipantsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions).map(o => o.value);
        setFormData(prev => ({...prev, participants: selected}));
    };

    return {
        showAdd, openAddModal, closeAddModal, handleAddSubmit, availableUsers,
        showManage, openManageModal, closeManageModal, handleEditSubmit, handleStatusSubmit, handleDelete,
        currentTraining, formData, handleChange, handleParticipantsChange, loading, globalError, fieldErrors,
        addDiscipline, updateDisciplineType, removeDiscipline, addDistance, updateDistanceValue, removeDistance,
        addSubDistance, updateSubDistanceValue, removeSubDistance
    };
}