import { Group, Avatar, Text } from '@mantine/core';
import { type UserResource } from '../../api/services';
import { formatImageSrc } from '../../utils';

export interface UserInfoCellProps {
    user?: UserResource | null;
    userId?: string | null;
    showLink?: boolean;
}

export function UserInfoCell({ user, userId, showLink = true }: UserInfoCellProps) {
    const displayName = user ? `${user.firstName} ${user.lastName}` : (userId ?? '');

    return (
        <Group wrap="nowrap">
            <Avatar src={formatImageSrc(user?.profilePhoto)}>?</Avatar>
            <div>
                <Text size="sm" fw={600} lineClamp={1}>
                    {displayName}
                </Text>
                {showLink && user?.link && (
                    <Text size="sm" c="dimmed" lineClamp={1}>
                        @{user.link}
                    </Text>
                )}
            </div>
        </Group>
    );
}
