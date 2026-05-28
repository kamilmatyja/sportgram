import React, {useState} from 'react';
import {TrainingProvider} from '../../api/providers/TrainingProvider';
import {UserProvider} from '../../api/providers/UserProvider';
import {FriendProvider} from '../../api/providers/FriendProvider';
import {TrainingBody} from '../../api/body/TrainingBody';
import {StatusBody} from '../../api/body/StatusBody';
import {TrainingResponse} from '../../api/responses/TrainingResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {createFormHandler} from '../../utils/formHandler';
import {useAppAccess} from '../../utils/hooks/useAppAccess';
import {FriendFilterQuery} from '../../api/queries/FriendFilterQuery';
import {FriendIndexQuery} from '../../api/queries/FriendIndexQuery';
import {FriendStatusEnum} from '../../enums/FriendStatusEnum';
import {TrainingDiscipline} from '../../api/body/TrainingDiscipline';
import {TrainingDistance} from '../../api/body/TrainingDistance';
import {TrainingSubDistance} from '../../api/body/TrainingSubDistance';
import {fetchRelatedUsers} from '../../utils/fetchRelatedUsers';
import {useModal} from '../../utils/hooks/useModal';
import {useFormState} from '../../utils/hooks/useFormState';

export function useTrainingModals(onSuccess: () => void) {
    const { currentUser } = useAppAccess();
    const addModal = useModal();
    const manageModal = useModal<TrainingResponse>();
    const { loading, globalError, fieldErrors, wrap, resetErrors } = useFormState();

    const [availableUsers, setAvailableUsers] = useState<UserResponse[]>([]);
    const [formData, setFormData] = useState<TrainingBody>(new TrainingBody('', '', '', '', '', '', [], []));

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
            const usersMap = await fetchRelatedUsers(Array.from(acceptedFriendIds), {}, userProvider);
            setAvailableUsers(Object.values(usersMap));
        } else {
            setAvailableUsers([]);
        }
    };

    const openAddModal = async () => {
        setFormData(new TrainingBody('', '', '', '', '', '', [], []));
        resetErrors();
        await wrap(async () => {
            if (currentUser) { await loadAvailableFriends(currentUser); }
        }).catch(() => {});
        addModal.open();
    };

    const handleAddSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        wrap(async () => {
            await trainingProvider.create(formData);
            addModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const openManageModal = async (tr: TrainingResponse) => {
        manageModal.open(tr);

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

        resetErrors();
        await wrap(async () => {
            if (currentUser) await loadAvailableFriends(currentUser);
        }).catch(() => {});
    };

    const handleEditSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!manageModal.data) return;
        wrap(async () => {
            await trainingProvider.update(manageModal.data!.id, formData);
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const handleStatusSubmit = async (newStatus: number) => {
        if (!manageModal.data) return;
        wrap(async () => {
            await trainingProvider.updateStatus(manageModal.data!.id, new StatusBody(newStatus));
            manageModal.close();
            onSuccess();
        }).catch(() => {});
    };

    const handleDelete = async () => {
        if (!manageModal.data) return;
        wrap(async () => {
            await trainingProvider.delete(manageModal.data!.id);
            manageModal.close();
            onSuccess();
        }).catch(() => {});
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
        showAdd: addModal.isOpen, openAddModal, closeAddModal: addModal.close, handleAddSubmit, availableUsers,
        showManage: manageModal.isOpen, openManageModal, closeManageModal: manageModal.close,
        handleEditSubmit, handleStatusSubmit, handleDelete,
        currentTraining: manageModal.data, formData, handleChange, handleParticipantsChange, loading, globalError, fieldErrors,
        addDiscipline, updateDisciplineType, removeDiscipline, addDistance, updateDistanceValue, removeDistance,
        addSubDistance, updateSubDistanceValue, removeSubDistance
    };
}