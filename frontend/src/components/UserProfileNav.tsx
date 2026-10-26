import { Group, Button } from '@mantine/core';
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
import { useAuth } from '../auth/AuthContext';

export interface UserProfileNavProps {
    user?: { link?: string | null; id?: string | null } | null;
    userLink?: string;
    isOwner?: boolean;
}

export function UserProfileNav({ user, userLink, isOwner }: UserProfileNavProps) {
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

    return (
        <Group gap="xs" wrap="wrap" mb="md">
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
    );
}

export default UserProfileNav;
