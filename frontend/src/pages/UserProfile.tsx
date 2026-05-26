import {useParams} from 'react-router-dom';
import {useUserProfile} from '../services/useUserProfile';
import {useUserModals} from '../services/useUserModals';
import {UserProfileView} from '../components/UserProfileView';
import {ManageUserModal} from '../components/ManageUserModal';
import {UserFeedsSection} from '../components/UserFeedsSection';

export default function UserProfile() {
    const {link} = useParams<{ link: string }>();
    const profileProps = useUserProfile(link);
    const modalsService = useUserModals(profileProps.refreshProfile);

    return (
        <>
            <UserProfileView {...profileProps} onManageClick={modalsService.openManageModal} />
            <UserFeedsSection
                user={profileProps.user}
                isMyProfile={profileProps.isMyProfile}
                isAdmin={profileProps.isAdmin}
                friendship={profileProps.friendship}
            />
            <ManageUserModal
                show={modalsService.showManage}
                managedUser={modalsService.managedUser}
                isMyProfile={profileProps.isMyProfile}
                isAdmin={profileProps.isAdmin}
                closeModal={modalsService.closeManageModal}
                loading={modalsService.loading}
                globalError={modalsService.globalError}
                fieldErrors={modalsService.fieldErrors}
                formData={modalsService.updateFormData}
                handleChange={modalsService.handleUpdateChange}
                handleEditSubmit={modalsService.handleEditSubmit}
                handleStatusSubmit={modalsService.handleStatusSubmit}
                handleDelete={modalsService.handleDelete}
            />
        </>
    );
}