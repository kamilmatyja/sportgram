import {useParams} from 'react-router-dom';
import {useGoalDetails} from '../services/useGoalDetails';
import {useGoalModals} from '../services/useGoalModals';
import {GoalDetailsView} from '../components/GoalDetailsView';
import {ManageGoalModal} from '../components/ManageGoalModal';

export default function GoalDetails() {
    const {link} = useParams<{ link: string }>();
    const detailsProps = useGoalDetails(link);
    const modalsService = useGoalModals(detailsProps.refreshGoal);

    return (
        <>
            <GoalDetailsView
                goal={detailsProps.goal}
                ownerUser={detailsProps.ownerUser}
                relatedUsers={detailsProps.relatedUsers}
                isMyProfile={detailsProps.isMyProfile}
                isAdmin={detailsProps.isAdmin}
                isParticipantOfGoal={detailsProps.isParticipantOfGoal}
                loading={detailsProps.loading}
                error={detailsProps.error}
                onManageClick={modalsService.openManageModal}
            />

            <ManageGoalModal
                user={detailsProps.ownerUser}
                currentUser={detailsProps.currentUser}
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
                handleParticipantStatusSubmit={modalsService.handleParticipantStatusSubmit}
                handleParticipantResultStatusSubmit={modalsService.handleParticipantResultStatusSubmit}
                handleDelete={modalsService.handleDelete}
            />
        </>
    );
}