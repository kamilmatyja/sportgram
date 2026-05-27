import {useParams} from 'react-router-dom';
import {useGoalDetails} from '../services/Goal/useGoalDetails';
import {useGoalModals} from '../services/Goal/useGoalModals';
import {useGoalInteractions} from '../services/Goal/useGoalInteractions';
import {GoalDetailsView} from '../components/Goal/GoalDetailsView';
import {ManageGoalModal} from '../components/Goal/ManageGoalModal';

export default function GoalDetails() {
    const {link} = useParams<{ link: string }>();
    const detailsProps = useGoalDetails(link);
    const modalsService = useGoalModals(detailsProps.refreshGoal);
    const interactions = useGoalInteractions(detailsProps.refreshGoal);

    return (
        <>
            <GoalDetailsView
                goal={detailsProps.goal}
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

            <ManageGoalModal
                user={detailsProps.ownerUser}
                availableUsers={modalsService.availableUsers}
                handleParticipantsChange={modalsService.handleParticipantsChange}
                show={modalsService.showManage}
                goal={modalsService.currentGoal}
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
            />
        </>
    );
}