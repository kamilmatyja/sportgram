import { useParams } from 'react-router-dom';
import { useUserGoals } from '../services/useUserGoals';
import { useGoalModals } from '../services/useGoalModals';
import { useGoalInteractions } from '../services/useGoalInteractions';
import { UserGoalsView } from '../components/UserGoalsView';
import { AddGoalModal } from '../components/AddGoalModal';
import { ManageGoalModal } from '../components/ManageGoalModal';

export default function UserGoals() {
    const { link } = useParams<{ link: string }>();

    const goalsService = useUserGoals(link);
    const modalsService = useGoalModals(goalsService.refreshGoals);
    const interactions = useGoalInteractions(goalsService.refreshGoals);

    return (
        <>
            <UserGoalsView
                user={goalsService.targetUser}
                currentUser={goalsService.currentUser}
                goals={goalsService.goals}
                relatedUsers={goalsService.relatedUsers}
                isMyProfile={goalsService.isMyProfile}
                isAdmin={goalsService.isAdmin}
                loading={goalsService.loading}
                error={goalsService.error}
                page={goalsService.page}
                limit={goalsService.limit}
                sort={goalsService.sort}
                filters={goalsService.filters}
                actionLoading={interactions.actionLoading}
                onFilterChange={goalsService.handleFilterChange}
                onSortChange={goalsService.handleSortChange}
                onLimitChange={goalsService.handleLimitChange}
                onPrevPage={goalsService.handlePrevPage}
                onNextPage={goalsService.handleNextPage}
                onAddClick={modalsService.openAddModal}
                onManageClick={modalsService.openManageModal}
                interactions={interactions}
            />

            <AddGoalModal
                user={goalsService.targetUser}
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
            />

            <ManageGoalModal
                user={goalsService.targetUser}
                availableUsers={modalsService.availableUsers}
                handleParticipantsChange={modalsService.handleParticipantsChange}
                show={modalsService.showManage}
                goal={modalsService.currentGoal}
                isMyProfile={goalsService.isMyProfile}
                isAdmin={goalsService.isAdmin}
                closeModal={modalsService.closeManageModal}
                loading={modalsService.loading}
                globalError={modalsService.globalError}
                fieldErrors={modalsService.fieldErrors}
                formData={modalsService.formData}
                handleChange={modalsService.handleChange}
                handleEditSubmit={modalsService.handleEditSubmit}
                handleStatusSubmit={modalsService.handleStatusSubmit}
                handleDelete={modalsService.handleDelete}
            />
        </>
    );
}