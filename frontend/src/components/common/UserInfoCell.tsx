import { Group, Avatar, Text } from '@mantine/core';
import { type UserResource } from '../../api/services';
import { formatImageSrc } from '../../utils/imageUtils';

export interface UserInfoCellProps {
    user?: UserResource | null;
    userId?: string | null;
    showLink?: boolean;
    avatarRadius?: number | string;
    size?: 'sm' | 'md' | 'xs';
}

export function UserInfoCell({ user, userId, showLink = true, avatarRadius = 5, size = 'sm' }: UserInfoCellProps) {
    const displayName = user ? `${user.firstName} ${user.lastName}` : (userId ?? '');

    return (
        <Group gap="sm" wrap="nowrap">
            <Avatar src={formatImageSrc(user?.profilePhoto)} radius={avatarRadius} size={size === 'xs' ? 24 : 34}>
                ?
            </Avatar>
            <div>
                <Text size={size} fw={600} lineClamp={1}>
                    {displayName}
                </Text>
                {showLink && user?.link && (
                    <Text size={size} c="dimmed" lineClamp={1}>
                        @{user.link}
                    </Text>
                )}
            </div>
        </Group>
    );
}
