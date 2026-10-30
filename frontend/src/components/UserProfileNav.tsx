import { Group, Button, Card, Box, Avatar, Text, Title, Image, Center } from '@mantine/core';
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
    IconArrowLeft,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { type UserResource } from '../api/services';
import { useAuth } from '../auth/AuthContext';
import { RoleEnum } from '../enums/RoleEnum';
import { useUserSubpageAccess } from '../hooks/useUserSubpageAccess';
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
              roles?: Array<{ role: number }>;
          }
        | null;
    userLink?: string;
    isOwner?: boolean;
    simplifiedHeader?: boolean;
}

export function UserProfileNav({ user, userLink, isOwner, simplifiedHeader = true }: UserProfileNavProps) {
    const { t } = useTranslation();
    const location = useLocation();
    const { currentUser, isAdmin } = useAuth();

    const link = user?.link || userLink || '';
    if (!link) return null;

    const owner = isOwner !== undefined ? isOwner : currentUser?.id === user?.id && !!user?.id;
    const targetUser = user && 'id' in user && user.id ? (user as UserResource) : null;
    const { canAccessSubpage } = useUserSubpageAccess({
        targetUser,
    });
    const hasAccess = owner || isAdmin || canAccessSubpage;

    const userRoles =
        user && 'roles' in user && Array.isArray((user as UserResource).roles)
            ? (user as UserResource).roles.map((r) => r.role)
            : [];
    const hasParticipant = userRoles.length > 0 ? userRoles.includes(RoleEnum.PARTICIPANT) : true;
    const hasOrganizer = userRoles.length > 0 ? userRoles.includes(RoleEnum.ORGANIZER) : true;

    const navItems = [
        { to: `/users/${link}/feeds`, icon: <IconArticle size={16} />, label: t('feeds') },
        { to: `/users/${link}/stories`, icon: <IconPlayerPlay size={16} />, label: t('stories') },
        { to: `/users/${link}/friends`, icon: <IconUsers size={16} />, label: t('friend') },
    ];

    if (hasOrganizer) {
        navItems.push({ to: `/users/${link}/pages`, icon: <IconBuildingStore size={16} />, label: t('pages') });
        navItems.push({ to: `/users/${link}/events`, icon: <IconCalendarEvent size={16} />, label: t('events') });
    }

    if (hasParticipant) {
        navItems.push({ to: `/users/${link}/trainings`, icon: <IconRun size={16} />, label: t('trainings') });
        navItems.push({ to: `/users/${link}/goals`, icon: <IconTarget size={16} />, label: t('goals') });
    }

    navItems.push({ to: `/users/${link}/conversations`, icon: <IconMessage size={16} />, label: t('conversations') });

    if (owner || isAdmin) {
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
    const isProfileRoot = location.pathname === `/users/${link}`;

    return (
        <Box mb="md">
            {simplifiedHeader && user && (
                <Card withBorder radius="md" p={0} mb="sm" shadow="xs" className="overflow-hidden">
                    {bgSrc ? (
                        <Box h={160} pos="relative" bg="var(--mantine-primary-color-filled)">
                            <Center pos="absolute" inset={0} style={{ zIndex: 0 }}>
                                <Text fz={48} fw={700} c="white" style={{ opacity: 0.8, userSelect: 'none' }}>
                                    ?
                                </Text>
                            </Center>
                            <Image
                                src={bgSrc}
                                h={160}
                                w="100%"
                                fit="cover"
                                alt={user.firstName ?? 'Background'}
                                pos="relative"
                                style={{ zIndex: 1 }}
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </Box>
                    ) : (
                        <Center h={160} bg="var(--mantine-primary-color-filled)">
                            <Text fz={48} fw={700} c="white" style={{ opacity: 0.8, userSelect: 'none' }}>
                                ?
                            </Text>
                        </Center>
                    )}

                    <Box p="md" pos="relative">
                        <Avatar
                            src={profileSrc}
                            size={100}
                            radius={5}
                            pos="absolute"
                            top={-50}
                            left={24}
                            className="profile-avatar-border"
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

                            {!isProfileRoot && (
                                <Button
                                    component={Link}
                                    to={`/users/${link}`}
                                    variant="light"
                                    size="xs"
                                    leftSection={<IconArrowLeft size={16} />}
                                >
                                    {t('backToProfile')}
                                </Button>
                            )}
                        </Group>
                    </Box>
                </Card>
            )}

            {hasAccess && (
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
            )}
        </Box>
    );
}

export default UserProfileNav;
