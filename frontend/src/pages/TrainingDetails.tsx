import {useParams} from 'react-router-dom';
import {useTrainingDetails} from '../services/useTrainingDetails';
import {useTrainingModals} from '../services/useTrainingModals';
import {TrainingDetailsView} from '../components/TrainingDetailsView';
import {ManageTrainingModal} from '../components/ManageTrainingModal';

export default function TrainingDetails() {
    const {link} = useParams<{ link: string }>();
    const detailsProps = useTrainingDetails(link);
    const modalsService = useTrainingModals(detailsProps.refreshTraining);

    return (
        <>
            <TrainingDetailsView
                training={detailsProps.training}
                ownerUser={detailsProps.ownerUser}
                relatedUsers={detailsProps.relatedUsers}
                isMyProfile={detailsProps.isMyProfile}
                isAdmin={detailsProps.isAdmin}
                isParticipantOfTraining={detailsProps.isParticipantOfTraining}
                loading={detailsProps.loading}
                error={detailsProps.error}
                onManageClick={modalsService.openManageModal}
            />

            <ManageTrainingModal
                user={detailsProps.ownerUser}
                currentUser={detailsProps.currentUser}
                availableUsers={modalsService.availableUsers}
                handleParticipantsChange={modalsService.handleParticipantsChange}
                show={modalsService.showManage}
                currentTraining={modalsService.currentTraining}
                isMyProfile={detailsProps.isMyProfile}
                isAdmin={detailsProps.isAdmin}
                closeModal={modalsService.closeManageModal}
                loading={modalsService.loading}
                globalError={modalsService.globalError}
                fieldErrors={modalsService.fieldErrors}
                formData={modalsService.formData}
                handleChange={modalsService.handleChange}
                handleEditSubmit={modalsService.handleEditSubmit}
                handleStatusSubmit={modalsService.handleStatusSubmit}
                handleParticipantStatusSubmit={modalsService.handleParticipantStatusSubmit}
                handleDelete={modalsService.handleDelete}
                addDiscipline={modalsService.addDiscipline}
                updateDisciplineType={modalsService.updateDisciplineType}
                removeDiscipline={modalsService.removeDiscipline}
                addDistance={modalsService.addDistance}
                updateDistanceValue={modalsService.updateDistanceValue}
                removeDistance={modalsService.removeDistance}
                addSubDistance={modalsService.addSubDistance}
                updateSubDistanceValue={modalsService.updateSubDistanceValue}
                removeSubDistance={modalsService.removeSubDistance}
            />
        </>
    );
}