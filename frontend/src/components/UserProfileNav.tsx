import { Group, Button, Box, Text, Title } from '@mantine/core';
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
    IconHeart,
    IconMessageCircle,
    IconBookmark,
    IconClipboardCheck,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { type UserResource } from '../api/services';
import { useAuth } from '../auth';
import { RoleEnum } from '../enums/RoleEnum';
import { useUserSubpageAccess } from '../hooks';
import { formatImageSrc } from '../utils';
import { HeaderBannerWithAvatar } from './common';

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
        { to: `/users/${link}/stories`, icon: <IconPlayerPlay size={16} />, label: t('stories') },
        { to: `/users/${link}/feeds`, icon: <IconArticle size={16} />, label: t('feeds') },
        { to: `/users/${link}/feed-reactions`, icon: <IconHeart size={16} />, label: t('reactions') },
        { to: `/users/${link}/feed-comments`, icon: <IconMessageCircle size={16} />, label: t('comments') },
        { to: `/users/${link}/friends`, icon: <IconUsers size={16} />, label: t('friends') },
    ];

    if (hasOrganizer) {
        navItems.push({ to: `/users/${link}/pages`, icon: <IconBuildingStore size={16} />, label: t('pages') });
    }

    navItems.push({ to: `/users/${link}/page-follows`, icon: <IconBookmark size={16} />, label: t('pageFollows') });

    if (hasOrganizer) {
        navItems.push({ to: `/users/${link}/events`, icon: <IconCalendarEvent size={16} />, label: t('events') });
    }

    if (hasParticipant) {
        navItems.push({
            to: `/users/${link}/event-signups`,
            icon: <IconClipboardCheck size={16} />,
            label: t('eventSignups'),
        });
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
                <HeaderBannerWithAvatar
                    backgroundPhotoSrc={bgSrc}
                    profilePhotoSrc={profileSrc}
                    altText={user.firstName ?? 'Background'}
                >
                    <Group justify="space-between" align="flex-start" mt={55}>
                        <div>
                            <Title order={2}>
                                {user.firstName} {user.lastName}
                            </Title>
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
                                {t('backToUser')}
                            </Button>
                        )}
                    </Group>
                </HeaderBannerWithAvatar>
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
