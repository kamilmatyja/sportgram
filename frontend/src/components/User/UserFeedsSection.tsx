import React from 'react';
import { Stack } from 'react-bootstrap';

import { ColorEnum } from '../../enums/ColorEnum';
import { useHomeFeeds } from '../../services/Home/useHomeFeeds';
import { HomeFeedsView } from '../Home/HomeFeedsView';

export const UserFeedsSection: React.FC<{ userId: string; color?: number }> = ({ userId, color }) => {
    const feedsService = useHomeFeeds(userId);
    const themeClass = color ? ColorEnum.getClass(color) : '';
    return (
        <Stack className={themeClass}>
            <HomeFeedsView {...feedsService} />
        </Stack>
    );
};
