import {useParams} from 'react-router-dom';
import {useUserTrainings} from '../services/User/useUserTrainings';
import {useTrainingModals} from '../services/Training/useTrainingModals';
import {useTrainingInteractions} from '../services/Training/useTrainingInteractions';
import {UserTrainingsView} from '../components/User/UserTrainingsView';
import {AddTrainingModal} from '../components/Training/AddTrainingModal';
import {ManageTrainingModal} from '../components/Training/ManageTrainingModal';

export default function UserTrainings() {
    const {link} = useParams<{ link: string }>();

    const trainingsService = useUserTrainings(link);
    const modalsService = useTrainingModals(trainingsService.refreshTrainings);
    const interactions = useTrainingInteractions(trainingsService.refreshTrainings);

    return (
        <>
            <UserTrainingsView
                user={trainingsService.targetUser}
                currentUser={trainingsService.currentUser}
                trainings={trainingsService.trainings}
                relatedUsers={trainingsService.relatedUsers}
                isMyProfile={trainingsService.isMyProfile}
                isAdmin={trainingsService.isAdmin}
                isParticipant={trainingsService.isParticipant}
                loading={trainingsService.loading}
                error={trainingsService.error}
                page={trainingsService.page}
                limit={trainingsService.limit}
                sort={trainingsService.sort}
                filters={trainingsService.filters}
                actionLoading={interactions.actionLoading}
                onFilterChange={trainingsService.handleFilterChange}
                onSortChange={trainingsService.handleSortChange}
                onLimitChange={trainingsService.handleLimitChange}
                onPrevPage={trainingsService.handlePrevPage}
                onNextPage={trainingsService.handleNextPage}
                onAddClick={modalsService.openAddModal}
                onManageClick={modalsService.openManageModal}
                interactions={interactions}
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