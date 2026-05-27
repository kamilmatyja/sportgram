import React from 'react';
import { HomeFeedsView } from './HomeFeedsView';
import { useHomeFeeds } from '../services/useHomeFeeds';
import { FriendStatusEnum } from '../enums/FriendStatusEnum';
import { UserResponse } from '../api/responses/UserResponse';

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

    if (!canViewFeeds || !user) return null;

    return (
        <div>
            <ProfileFeedsWrapper userId={user.id} />
        </div>
    );
};