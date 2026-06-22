import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {UserResponse} from '../../api/responses/UserResponse';
import {Link} from 'react-router-dom';
import {Stack} from 'react-bootstrap';
import BootstrapIcon from '../Common/BootstrapIcon';

interface UserProfileNavProps {
    user: UserResponse;
    isMyProfile: boolean;
}

export const UserProfileNav: React.FC<UserProfileNavProps> = ({user, isMyProfile}) => {
    const {t} = useTranslation();

    return (
        <Stack direction="horizontal" className="flex-wrap gap-2 mb-4 overflow-x-auto pb-2">
            <Link to={`/users/${user.link}/feeds`} className="btn btn-profile-outline-primary text-nowrap">
                <BootstrapIcon name="list-ul" className="me-1" /> {t('feeds')}
            </Link>
            <Link to={`/users/${user.link}/stories`} className="btn btn-profile-outline-primary text-nowrap">
                <BootstrapIcon name="collection-play" className="me-1" /> {t('stories')}
            </Link>
            <Link to={`/users/${user.link}/friends`} className="btn btn-profile-outline-primary text-nowrap">
                <BootstrapIcon name="people" className="me-1" /> {t('friend')}
            </Link>
            <Link to={`/users/${user.link}/goals`} className="btn btn-profile-outline-primary text-nowrap">
                <BootstrapIcon name="bullseye" className="me-1" /> {t('goals')}
            </Link>
            <Link to={`/users/${user.link}/pages`} className="btn btn-profile-outline-primary text-nowrap">
                <BootstrapIcon name="file-earmark-text" className="me-1" /> {t('pages')}
            </Link>
            <Link to={`/users/${user.link}/events`} className="btn btn-profile-outline-primary text-nowrap">
                <BootstrapIcon name="calendar-event" className="me-1" /> {t('events')}
            </Link>
            <Link to={`/users/${user.link}/trainings`} className="btn btn-profile-outline-primary text-nowrap">
                <BootstrapIcon name="bar-chart-steps" className="me-1" /> {t('trainings')}
            </Link>
            {isMyProfile && (
                <Link to={`/users/${user.link}/notifications`} className="btn btn-profile-outline-primary text-nowrap">
                    <BootstrapIcon name="bell" className="me-1" /> {t('notifications')}
                </Link>
            )}
            {isMyProfile && (
                <Link to={`/users/${user.link}/push-subscriptions`} className="btn btn-profile-outline-primary text-nowrap">
                    <BootstrapIcon name="broadcast-pin" className="me-1" /> {t('pushSubscriptions')}
                </Link>
            )}
            <Link to={`/users/${user.link}/conversations`} className="btn btn-profile-outline-primary text-nowrap">
                <BootstrapIcon name="chat-dots" className="me-1" /> {t('conversations')}
            </Link>
        </Stack>
    );
};