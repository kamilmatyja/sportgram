import {useParams} from 'react-router-dom';
import {useUserTrainings} from '../services/useUserTrainings';
import {useTrainingModals} from '../services/useTrainingModals';
import {UserTrainingsView} from '../components/UserTrainingsView';
import {AddTrainingModal} from '../components/AddTrainingModal';
import {ManageTrainingModal} from '../components/ManageTrainingModal';

export default function UserTrainings() {
    const {link} = useParams<{ link: string }>();

    const trainingsService = useUserTrainings(link);
    const modalsService = useTrainingModals(trainingsService.refreshTrainings);

    return (
        <>
            <UserTrainingsView
                user={trainingsService.targetUser}
                trainings={trainingsService.trainings}
                isMyProfile={trainingsService.isMyProfile}
                isAdmin={trainingsService.isAdmin}
                isParticipant={trainingsService.isParticipant}
                loading={trainingsService.loading}
                error={trainingsService.error}
                page={trainingsService.page}
                limit={trainingsService.limit}
                sort={trainingsService.sort}
                filters={trainingsService.filters}
                onFilterChange={trainingsService.handleFilterChange}
                onSortChange={trainingsService.handleSortChange}
                onLimitChange={trainingsService.handleLimitChange}
                onPrevPage={trainingsService.handlePrevPage}
                onNextPage={trainingsService.handleNextPage}
                onAddClick={modalsService.openAddModal}
                onManageClick={modalsService.openManageModal}
            />

            <AddTrainingModal
                user={trainingsService.targetUser}
                show={modalsService.showAdd}
                availableUsers={modalsService.availableUsers}
                closeModal={modalsService.closeAddModal}
                loading={modalsService.loading}
                globalError={modalsService.globalError}
                fieldErrors={modalsService.fieldErrors}
                formData={modalsService.formData}
                handleChange={modalsService.handleChange}
                handleParticipantsChange={modalsService.handleParticipantsChange}
                handleSubmit={modalsService.handleAddSubmit}
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

            <ManageTrainingModal
                user={trainingsService.targetUser}
                currentUser={trainingsService.currentUser}
                availableUsers={modalsService.availableUsers}
                handleParticipantsChange={modalsService.handleParticipantsChange}
                show={modalsService.showManage}
                currentTraining={modalsService.currentTraining}
                isMyProfile={trainingsService.isMyProfile}
                isAdmin={trainingsService.isAdmin}
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