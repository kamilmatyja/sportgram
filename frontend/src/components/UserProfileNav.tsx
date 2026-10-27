import { Group, Button, Card, Box, Avatar, Text, Title, Image } from '@mantine/core';
import {
    IconArticle,
    IconPlayerPlay,
    IconUsers,
    IconTarget,
    IconBuildingStore,
    IconCalendarEvent,
    IconRun,
    IconMessage,
    IconBell,
    IconDevices,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { type UserResource } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { formatImageSrc } from '../utils/imageUtils';

export interface UserProfileNavProps {
    user?:
        | UserResource
        | {
              link?: string | null;
              id?: string | null;
              firstName?: string | null;
              lastName?: string | null;
              profilePhoto?: string | null;
              backgroundPhoto?: string | null;
          }
        | null;
    userLink?: string;
    isOwner?: boolean;
    simplifiedHeader?: boolean;
}

export function UserProfileNav({ user, userLink, isOwner, simplifiedHeader = true }: UserProfileNavProps) {
    const { t } = useTranslation();
    const location = useLocation();
    const { currentUser } = useAuth();

    const link = user?.link || userLink || '';
    if (!link) return null;

    const owner = isOwner !== undefined ? isOwner : currentUser?.id === user?.id && !!user?.id;

    const navItems = [
        { to: `/users/${link}/feeds`, icon: <IconArticle size={16} />, label: t('feeds') },
        { to: `/users/${link}/stories`, icon: <IconPlayerPlay size={16} />, label: t('stories') },
        { to: `/users/${link}/friends`, icon: <IconUsers size={16} />, label: t('friend') },
        { to: `/users/${link}/goals`, icon: <IconTarget size={16} />, label: t('goals') },
        { to: `/users/${link}/pages`, icon: <IconBuildingStore size={16} />, label: t('pages') },
        { to: `/users/${link}/events`, icon: <IconCalendarEvent size={16} />, label: t('events') },
        { to: `/users/${link}/trainings`, icon: <IconRun size={16} />, label: t('trainings') },
        { to: `/users/${link}/conversations`, icon: <IconMessage size={16} />, label: t('conversations') },
    ];

    if (owner) {
        navItems.push(
            { to: `/users/${link}/notifications`, icon: <IconBell size={16} />, label: t('notifications') },
            {
                to: `/users/${link}/push-subscriptions`,
                icon: <IconDevices size={16} />,
                label: t('pushSubscriptions'),
            },
        );
    }

    const bgSrc = formatImageSrc(user?.backgroundPhoto);
    const profileSrc = formatImageSrc(user?.profilePhoto);

    return (
        <Box mb="md">
            {simplifiedHeader && user && (
                <Card withBorder radius="md" p={0} mb="sm" shadow="xs" className="overflow-hidden">
                    {bgSrc ? (
                        <Image src={bgSrc} h={160} fit="cover" alt={user.firstName ?? 'Background'} />
                    ) : (
                        <Box h={160} bg="blue.7" />
                    )}

                    <Box p="md" pos="relative">
                        <Avatar
                            src={profileSrc}
                            size={100}
                            radius={100}
                            pos="absolute"
                            top={-50}
                            left={24}
                            className="profile-avatar-border"
                            color="blue"
                            component={Link}
                            to={`/users/${link}`}
                        >
                            ?
                        </Avatar>

                        <Group justify="space-between" align="flex-start" mt={55}>
                            <div>
                                <Link to={`/users/${link}`} className="no-decoration">
                                    <Title order={2}>
                                        {user.firstName} {user.lastName}
                                    </Title>
                                </Link>
                                <Text size="sm" c="dimmed">
                                    @{user.link}
                                </Text>
                            </div>

                            <Button component={Link} to={`/users/${link}`} variant="light" size="xs">
                                {t('profile')}
                            </Button>
                        </Group>
                    </Box>
                </Card>
            )}

            <Group gap="xs" wrap="wrap">
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.to);
                    return (
                        <Button
                            key={item.to}
                            component={Link}
                            to={item.to}
                            variant={isActive ? 'filled' : 'light'}
                            size="xs"
                            leftSection={item.icon}
                        >
                            {item.label}
                        </Button>
                    );
                })}
            </Group>
        </Box>
    );
}

export default UserProfileNav;
