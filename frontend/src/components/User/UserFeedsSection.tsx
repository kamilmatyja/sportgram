import React from 'react';
import {HomeFeedsView} from '../Home/HomeFeedsView';
import {useHomeFeeds} from '../../services/Home/useHomeFeeds';
import {ColorEnum} from '../../enums/ColorEnum';
import {Stack} from 'react-bootstrap';

const ProfileFeedsWrapper = ({userId}: { userId: string }) => {
    const feedsService = useHomeFeeds(userId);
    return <HomeFeedsView {...feedsService} />;
};

export const UserFeedsSection: React.FC<{ userId: string, color?: number }> = ({userId, color}) => {
    const themeClass = color ? ColorEnum.getClass(color) : '';
    return (
        <Stack className={themeClass}>
            <ProfileFeedsWrapper userId={userId}/>
        </Stack>
    );
};