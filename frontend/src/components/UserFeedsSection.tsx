import React from 'react';
import {HomeFeedsView} from './HomeFeedsView';
import {useHomeFeeds} from '../services/useHomeFeeds';
import {FriendStatusEnum} from '../enums/FriendStatusEnum';
import {ColorEnum} from '../enums/ColorEnum';
import {UserResponse} from '../api/responses/UserResponse';

interface UserFeedsSectionProps {
    user: UserResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    friendship?: { status: FriendStatusEnum } | null;
}

const ProfileFeedsWrapper = ({ userId }: { userId: string }) => {
    const feedsService = useHomeFeeds(userId);
    return <HomeFeedsView {...feedsService} />;
};

export const UserFeedsSection: React.FC<UserFeedsSectionProps> = ({ user, isMyProfile, isAdmin, friendship }) => {
    const canViewFeeds = user && (
        isMyProfile ||
        isAdmin ||
        friendship?.status === FriendStatusEnum.ACCEPTED
    );
    const hexColor = user ? ColorEnum.getHex(user.color) : undefined;

    if (!canViewFeeds || !user) return null;

    return (
        <div style={hexColor ? { '--theme-color': hexColor } as React.CSSProperties : {}}>
            <ProfileFeedsWrapper userId={user.id} />
        </div>
    );
};

