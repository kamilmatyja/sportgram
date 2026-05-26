import {useParams} from 'react-router-dom';
import {useUserProfile} from '../services/useUserProfile';
import {UserProfileView} from '../components/UserProfileView';
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

    const canViewFeeds = profileProps.user && (
        profileProps.isMyProfile ||
        profileProps.isAdmin ||
        profileProps.friendship?.status === FriendStatusEnum.ACCEPTED
    );

    const hexColor = profileProps.user ? ColorEnum.getHex(profileProps.user.color) : undefined;

    return (
        <>
            <UserProfileView {...profileProps} />
            {canViewFeeds && (
                <div style={hexColor ? { '--theme-color': hexColor } as React.CSSProperties : {}}>
                    <ProfileFeedsWrapper userId={profileProps.user!.id} />
                </div>
            )}
        </>
    );
}