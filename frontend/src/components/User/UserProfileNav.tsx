import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {UserResponse} from '../../api/responses/UserResponse';

interface UserProfileNavProps {
    user: UserResponse;
    isMyProfile: boolean;
}

export const UserProfileNav: React.FC<UserProfileNavProps> = ({user, isMyProfile}) => {
    const {t} = useTranslation();

    return (
        <div className="d-flex flex-wrap gap-2 mb-4 overflow-x-auto pb-2">
            <a href={`/users/${user.link}/feeds`} className="btn btn-profile-outline-primary text-nowrap">
                <i className="bi bi-list-ul me-1"></i> {t('feeds')}
            </a>
            <a href={`/users/${user.link}/stories`} className="btn btn-profile-outline-primary text-nowrap">
                <i className="bi bi-collection-play me-1"></i> {t('stories')}
            </a>
            <a href={`/users/${user.link}/friends`} className="btn btn-profile-outline-primary text-nowrap">
                <i className="bi bi-people me-1"></i> {t('friend')}
            </a>
            <a href={`/users/${user.link}/goals`} className="btn btn-profile-outline-primary text-nowrap">
                <i className="bi bi-bullseye me-1"></i> {t('goals')}
            </a>
            <a href={`/users/${user.link}/pages`} className="btn btn-profile-outline-primary text-nowrap">
                <i className="bi bi-file-earmark-text me-1"></i> {t('pages')}
            </a>
            <a href={`/users/${user.link}/events`} className="btn btn-profile-outline-primary text-nowrap">
                <i className="bi bi-calendar-event me-1"></i> {t('events')}
            </a>
            <a href={`/users/${user.link}/trainings`} className="btn btn-profile-outline-primary text-nowrap">
                <i className="bi bi-bar-chart-steps me-1"></i> {t('trainings')}
            </a>
            {isMyProfile && (
                <a href={`/users/${user.link}/notifications`} className="btn btn-profile-outline-primary text-nowrap">
                    <i className="bi bi-bell me-1"></i> {t('notifications')}
                </a>
            )}
            {isMyProfile && (
                <a href={`/users/${user.link}/push-subscriptions`}
                   className="btn btn-profile-outline-primary text-nowrap">
                    <i className="bi bi-broadcast-pin me-1"></i> {t('pushSubscriptions')}
                </a>
            )}
            <a href={`/users/${user.link}/conversations`} className="btn btn-profile-outline-primary text-nowrap">
                <i className="bi bi-chat-dots me-1"></i> {t('conversations')}
            </a>
        </div>
    );
};