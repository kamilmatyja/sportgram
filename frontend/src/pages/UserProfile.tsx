import { useParams } from 'react-router-dom';

import { StoriesCarousel } from '../components/Story/StoriesCarousel';
import { ManageUserModal } from '../components/User/ManageUserModal';
import { UserFeedsSection } from '../components/User/UserFeedsSection';
import { UserProfileView } from '../components/User/UserProfileView';
import { FriendStatusEnum } from '../enums/FriendStatusEnum';
import { useUserModals } from '../services/User/useUserModals';
import { useUserProfile } from '../services/User/useUserProfile';

export default function UserProfile() {
    const { link } = useParams<{ link: string }>();
    const profileProps = useUserProfile(link);
    const modalsService = useUserModals(profileProps.refreshProfile);

    const { user, isMyProfile, isAdmin, friendship } = profileProps;
    const canViewDetails = user && (isMyProfile || isAdmin || friendship?.status === FriendStatusEnum.ACCEPTED);

    return (
        <>
            <UserProfileView {...profileProps} onManageClick={modalsService.openManageModal} />

            {canViewDetails && (
                <>
                    <StoriesCarousel targetUserId={user.id} />
                    <UserFeedsSection userId={user.id} color={user.color} />
                </>
            )}

            <ManageUserModal
                themeColor={user?.color}
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
