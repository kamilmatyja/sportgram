import { useParams } from 'react-router-dom';
import { useUserProfile } from '../services/User/useUserProfile';
import { useUserModals } from '../services/User/useUserModals';
import { UserProfileView } from '../components/User/UserProfileView';
import { ManageUserModal } from '../components/User/ManageUserModal';
import { UserFeedsSection } from '../components/User/UserFeedsSection';
import { ColorEnum } from '../enums/ColorEnum';
import { FriendStatusEnum } from '../enums/FriendStatusEnum';

export default function UserProfile() {
    const { link } = useParams<{ link: string }>();
    const profileProps = useUserProfile(link);
    const modalsService = useUserModals(profileProps.refreshProfile);

    const { user, isMyProfile, isAdmin, friendship } = profileProps;
    const themeClass = user ? ColorEnum.getClass(user.color) : '';
    const canViewDetails = user && (isMyProfile || isAdmin || friendship?.status === FriendStatusEnum.ACCEPTED);

    return (
        <div className={themeClass}>
            <UserProfileView {...profileProps} onManageClick={modalsService.openManageModal} />

            {canViewDetails && (
                <UserFeedsSection userId={user.id} />
            )}

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
        </div>
    );
}