import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {UserResponse} from '../api/responses/UserResponse';
import {FriendResponse} from '../api/responses/FriendResponse';
import {ColorEnum} from '../enums/ColorEnum';
import {CountryEnum} from '../enums/CountryEnum';
import {GenderEnum} from '../enums/GenderEnum';
import {UserStatusEnum} from '../enums/UserStatusEnum';
import {RoleEnum} from '../enums/RoleEnum';
import {DisciplineEnum} from '../enums/DisciplineEnum';
import {getAgeFromDate} from '../utils/dateFormat';
import {FriendStatusEnum} from '../enums/FriendStatusEnum';

interface UserProfileViewProps {
    user: UserResponse | null;
    currentUser: UserResponse | null;
    friendship: FriendResponse | null;
    loading: boolean;
    error: string | null;
    statusLoading: boolean;
    handleAddFriend: () => void;
    handleUpdateFriendStatus: (status: number) => void;
    handleChangeUserStatus: (status: number) => void;
    isMyProfile: boolean;
    isAdmin: boolean;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
                                                                    user,
                                                                    currentUser,
                                                                    friendship,
                                                                    loading,
                                                                    error,
                                                                    statusLoading,
                                                                    handleAddFriend,
                                                                    handleUpdateFriendStatus,
                                                                    handleChangeUserStatus,
                                                                    isMyProfile,
                                                                    isAdmin
                                                                }) => {
    const {t} = useTranslation();

    if (loading) return <div className="container mt-5 text-center">
        <div className="spinner-border"/>
    </div>;
    if (error || !user) return <div className="container mt-5 alert alert-danger">{error || t('userNotFound')}</div>;

    const hexColor = ColorEnum.getHex(user.color);

    return (
        <div
            className="container mt-4 mb-5"
            style={{ '--theme-color': hexColor } as React.CSSProperties}
        >
            <div className="card shadow-sm mb-4">
                <div className="card-img-top bg-secondary position-relative overflow-hidden border-top border-4 profile-theme-border profile-bg-container">
                    <img
                        src={`data:image/webp;base64,${user.backgroundPhoto}`}
                        alt="Background"
                        className="w-100 h-100 object-fit-cover"
                    />
                </div>

                <div className="card-body position-relative pt-5">
                    <img
                        src={`data:image/webp;base64,${user.profilePhoto}`}
                        alt="Profile"
                        className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar object-fit-cover"
                    />

                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <div>
                            <h2 className="mb-0 profile-theme-text">{user.firstName} {user.lastName}</h2>
                            <p className="text-muted mb-2">@{user.link}</p>
                            <p className="mb-0">{user.bio}</p>
                            <ul className="list-unstyled mt-2 mb-2">
                                {(isMyProfile || isAdmin || friendship?.status === FriendStatusEnum.ACCEPTED) && (
                                    <>
                                        <li><strong>{t('email')}:</strong> {user.email}</li>
                                        <li><strong>{t('phone')}:</strong> {user.phone}</li>
                                        <li><strong>{t('country')}:</strong> {CountryEnum.getOptions(t).find(opt => opt.value === user.country)?.label || user.country}</li>
                                        <li><strong>{t('gender')}:</strong> {GenderEnum.getOptions(t).find(opt => opt.value === user.gender)?.label || user.gender}</li>
                                        <li><strong>{t('age')}:</strong> {getAgeFromDate(user.birthAt)}</li>
                                        <li className="d-flex align-items-center flex-wrap gap-2">
                                            <strong>{t('userStatus')}:</strong>
                                            <span>{UserStatusEnum.getOptions(t).find(opt => opt.value === user.status)?.label || user.status}</span>
                                            {!isMyProfile && isAdmin && (
                                                <>
                                                    <strong>{t('changeStatus')}: </strong>
                                                    {UserStatusEnum.getNanoOptions(t)
                                                    .filter(opt => opt.value !== user.status)
                                                    .map(opt => (
                                                        <button
                                                            key={opt.value}
                                                            className="btn btn-xs btn-profile-outline-warning py-0 px-2"
                                                            onClick={() => handleChangeUserStatus(opt.value)}
                                                            disabled={statusLoading}
                                                        >
                                                            {statusLoading ? t('loading') : opt.label}
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                        </li>
                                        <li className="d-flex align-items-center flex-wrap gap-2">
                                            <strong>{t('role')}:</strong>
                                            {user.roles && user.roles.length > 0 && user.roles.map((role: any) => (
                                                <span key={role.id} className="badge profile-theme-bg">
                                                {RoleEnum.getOptions(t).find(opt => opt.value === role.role)?.label || role.role}
                                            </span>
                                            ))}
                                        </li>
                                        <li className="d-flex align-items-center flex-wrap gap-2">
                                            <strong>{t('discipline')}:</strong>
                                            {user.disciplines && user.disciplines.length > 0 && user.disciplines.map((disc: any) => (
                                                <span key={disc.id}
                                                      className="badge bg-light text-dark border border-1 profile-theme-border">
                                                {DisciplineEnum.getOptions(t).find(opt => opt.value === disc.discipline)?.label || disc.discipline}
                                            </span>
                                            ))}
                                        </li>
                                    </>
                                )}
                                {!isMyProfile && !friendship && (
                                    <li className="d-flex align-items-center flex-wrap gap-2">
                                        <strong>{t('friendshipStatus')}:</strong>
                                        <button
                                            className="btn btn-xs btn-profile-outline-primary py-0 px-2"
                                            onClick={handleAddFriend}
                                        >
                                            {t('addFriend')}
                                        </button>
                                    </li>
                                )}
                                {!isMyProfile && friendship && (
                                    <li className="d-flex align-items-center flex-wrap gap-2">
                                        <strong>{t('friendshipStatus')}:</strong>
                                        <span>{FriendStatusEnum.getOptions(t).find(opt => opt.value === friendship.status)?.label || friendship.status}</span>
                                        <>
                                            {(friendship.senderUserId === currentUser?.id || friendship.receiverUserId === currentUser?.id) && (
                                                <>
                                                    <strong>{t('changeStatus')}: </strong>
                                                    {FriendStatusEnum.getNanoOptions(t).map(opt => (
                                                        opt.value !== friendship.status && (
                                                            <button
                                                                key={opt.value}
                                                                className="btn btn-xs btn-profile-outline-primary py-0 px-2"
                                                                onClick={() => handleUpdateFriendStatus(opt.value)}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        )
                                                    ))}
                                                </>
                                            )}
                                        </>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3 overflow-x-auto">
                {(isMyProfile || isAdmin || friendship?.status === FriendStatusEnum.ACCEPTED) && (
                    <>
                        {isMyProfile && (
                            <a href={`/users/${user.link}/settings`} className="btn btn-profile-outline-primary">
                                <i className="bi bi-gear me-1"></i> {t('settings')}
                            </a>
                        )}
                        <a href={`/users/${user.link}/feeds`} className="btn btn-profile-outline-primary">
                            <i className="bi bi-list-ul me-1"></i> {t('feeds')}
                        </a>
                        <a href={`/users/${user.link}/stories`} className="btn btn-profile-outline-primary">
                            <i className="bi bi-collection-play me-1"></i> {t('stories')}
                        </a>
                        <a href={`/users/${user.link}/friends`} className="btn btn-profile-outline-primary">
                            <i className="bi bi-people me-1"></i> {t('friends')}
                        </a>
                        <a href={`/users/${user.link}/goals`} className="btn btn-profile-outline-primary">
                            <i className="bi bi-bullseye me-1"></i> {t('goals')}
                        </a>
                        <a href={`/users/${user.link}/pages`} className="btn btn-profile-outline-primary">
                            <i className="bi bi-file-earmark-text me-1"></i> {t('pages')}
                        </a>
                        <a href={`/users/${user.link}/events`} className="btn btn-profile-outline-primary">
                            <i className="bi bi-calendar-event me-1"></i> {t('events')}
                        </a>
                        <a href={`/users/${user.link}/trainings`} className="btn btn-profile-outline-primary">
                            <i className="bi bi-bar-chart-steps me-1"></i> {t('trainings')}
                        </a>
                        {isMyProfile && (
                            <a href={`/users/${user.link}/notifications`} className="btn btn-profile-outline-primary">
                                <i className="bi bi-bell me-1"></i> {t('notifications')}
                            </a>
                        )}
                        {isMyProfile && (
                            <a href={`/users/${user.link}/push-subscriptions`}
                               className="btn btn-profile-outline-primary">
                                <i className="bi bi-broadcast-pin me-1"></i> {t('pushSubscriptions')}
                            </a>
                        )}
                        <a href={`/users/${user.link}/conversations`} className="btn btn-profile-outline-primary">
                            <i className="bi bi-chat-dots me-1"></i> {t('conversations')}
                        </a>
                    </>
                )}
            </div>
        </div>
    );
};