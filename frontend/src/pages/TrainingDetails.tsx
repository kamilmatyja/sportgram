import {useParams} from 'react-router-dom';
import {useTrainingDetails} from '../services/Training/useTrainingDetails';
import {useTrainingModals} from '../services/Training/useTrainingModals';
import {useTrainingInteractions} from '../services/Training/useTrainingInteractions';
import {TrainingDetailsView} from '../components/Training/TrainingDetailsView';
import {ManageTrainingModal} from '../components/Training/ManageTrainingModal';

export default function TrainingDetails() {
    const {link} = useParams<{ link: string }>();
    const detailsProps = useTrainingDetails(link);
    const modalsService = useTrainingModals(detailsProps.refreshTraining);
    const interactions = useTrainingInteractions(detailsProps.refreshTraining);

    return (
        <>
            <TrainingDetailsView
                training={detailsProps.training}
                ownerUser={detailsProps.ownerUser}
                currentUser={detailsProps.currentUser}
                relatedUsers={detailsProps.relatedUsers}
                isMyProfile={detailsProps.isMyProfile}
                isAdmin={detailsProps.isAdmin}
                loading={detailsProps.loading}
                error={detailsProps.error}
                onManageClick={modalsService.openManageModal}
                interactions={interactions}
            />

            <ManageTrainingModal
                user={detailsProps.ownerUser}
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