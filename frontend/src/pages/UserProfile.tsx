import {useParams} from 'react-router-dom';
import {useUserProfile} from '../services/useUserProfile';
import {useUserModals} from '../services/useUserModals';
import {UserProfileView} from '../components/UserProfileView';
import {ManageUserModal} from '../components/ManageUserModal';
import {useHomeFeeds} from '../services/useHomeFeeds';
import {HomeFeedsView} from '../components/HomeFeedsView';
import {FriendStatusEnum} from '../enums/FriendStatusEnum';
import {ColorEnum} from '../enums/ColorEnum';
import React from 'react';

const ProfileFeedsWrapper = ({ userId }: { userId: string }) => {
    const feedsService = useHomeFeeds(userId);
    return <HomeFeedsView {...feedsService} />;
};

export default function UserProfile() {
    const {link} = useParams<{ link: string }>();
    const profileProps = useUserProfile(link);
    const modalsService = useUserModals(profileProps.refreshProfile);

    const canViewFeeds = profileProps.user && (
        profileProps.isMyProfile ||
        profileProps.isAdmin ||
        profileProps.friendship?.status === FriendStatusEnum.ACCEPTED
    );

    const hexColor = profileProps.user ? ColorEnum.getHex(profileProps.user.color) : undefined;

    return (
        <>
            <UserProfileView {...profileProps} onManageClick={modalsService.openManageModal} />
            {canViewFeeds && (
                <div style={hexColor ? { '--theme-color': hexColor } as React.CSSProperties : {}}>
                    <ProfileFeedsWrapper userId={profileProps.user!.id} />
                </div>
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
        </>
    );
}