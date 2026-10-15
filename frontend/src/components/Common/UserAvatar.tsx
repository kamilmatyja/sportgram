import React from 'react';
import { Stack } from 'react-bootstrap';

import { UserResponse } from '../../api/responses/UserResponse';
import { Base64Image } from './Base64Image';

interface UserAvatarProps {
    user: UserResponse | null | undefined;
    size: 32 | 48;
    className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, size, className = '' }) => (
    <Base64Image
        data={user?.profilePhoto}
        roundedCircle
        className={`object-fit-cover feed-avatar-${size} ${className}`.trim()}
        fallback={<Stack className={`bg-secondary rounded-circle feed-avatar-${size}`} />}
    />
);
