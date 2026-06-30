import React from 'react';
import { Stack } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import BootstrapIcon from '../Common/BootstrapIcon';

interface UserProfileNavProps {
    user: UserResponse;
    isMyProfile: boolean;
}

export const UserProfileNav: React.FC<UserProfileNavProps> = ({ user, isMyProfile }) => {
    const { t } = useTranslation();

    const navItems = [
        { to: `/users/${user.link}/feeds`, icon: 'list-ul', label: t('feeds') },
        { to: `/users/${user.link}/stories`, icon: 'collection-play', label: t('stories') },
        { to: `/users/${user.link}/friends`, icon: 'people', label: t('friend') },
        { to: `/users/${user.link}/goals`, icon: 'bullseye', label: t('goals') },
        { to: `/users/${user.link}/pages`, icon: 'file-earmark-text', label: t('pages') },
        { to: `/users/${user.link}/events`, icon: 'calendar-event', label: t('events') },
        { to: `/users/${user.link}/trainings`, icon: 'bar-chart-steps', label: t('trainings') },
        { to: `/users/${user.link}/conversations`, icon: 'chat-dots', label: t('conversations') },
    ];

    if (isMyProfile) {
        navItems.push(
            { to: `/users/${user.link}/notifications`, icon: 'bell', label: t('notifications') },
            { to: `/users/${user.link}/push-subscriptions`, icon: 'broadcast-pin', label: t('pushSubscriptions') },
        );
    }

    return (
        <Stack direction="horizontal" className="flex-wrap gap-2 mb-4 overflow-x-auto pb-2 border-bottom border-light">
            {navItems.map((item, idx) => (
                <Link key={idx} to={item.to} className="btn btn-profile-outline-primary text-nowrap">
                    <BootstrapIcon name={item.icon} className="me-1" /> {item.label}
                </Link>
            ))}
        </Stack>
    );
};
