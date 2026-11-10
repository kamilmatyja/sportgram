import { Group, Avatar, Text, Skeleton } from '@mantine/core';
import { type UserResource } from '../../api/services';
import { formatImageSrc } from '../../utils';

export interface UserInfoCellProps {
    user?: UserResource | null;
    userId?: string | null;
    showLink?: boolean;
}

export function UserInfoCell({ user, showLink = true }: UserInfoCellProps) {
    if (!user) {
        return (
            <Group wrap="nowrap">
                <Skeleton height={38} circle />
                <div>
                    <Skeleton height={14} width={120} mb={4} />
                    {showLink && <Skeleton height={10} width={80} />}
                </div>
            </Group>
        );
    }

    const displayName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.link || '';

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
