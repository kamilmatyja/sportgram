import React from 'react';
import { HomeFeedsView } from './HomeFeedsView';
import { useHomeFeeds } from '../services/useHomeFeeds';

const ProfileFeedsWrapper = ({ userId }: { userId: string }) => {
    const feedsService = useHomeFeeds(userId);
    return <HomeFeedsView {...feedsService} />;
};

export const UserFeedsSection: React.FC<{ userId: string }> = ({ userId }) => {
    return (
        <div className="mt-4">
            <ProfileFeedsWrapper userId={userId} />
        </div>
    );
};