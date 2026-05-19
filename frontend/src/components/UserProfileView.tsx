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
    selectedStatus: number | null;
    setSelectedStatus: (status: number) => void;
    selectedFriendStatus: number | null;
    setSelectedFriendStatus: (status: number) => void;
    handleAddFriend: () => void;
    handleUpdateFriendStatus: (status: number) => void;
    handleChangeUserStatus: () => void;
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
                                                                    selectedStatus,
                                                                    setSelectedStatus,
                                                                    selectedFriendStatus,
                                                                    setSelectedFriendStatus,
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
                                {user.email && (
                                    <li><strong>{t('email')}:</strong> {user.email}</li>
                                )}
                                {user.country && (
                                    <li>
                                        <strong>{t('country')}:</strong> {CountryEnum.getOptions(t).find(opt => opt.value === user.country)?.label || user.country}
                                    </li>
                                )}
                                {user.gender && (
                                    <li>
                                        <strong>{t('gender')}:</strong> {GenderEnum.getOptions(t).find(opt => opt.value === user.gender)?.label || user.gender}
                                    </li>
                                )}
                                {user.birthAt && (
                                    <li><strong>{t('age')}:</strong> {getAgeFromDate(user.birthAt)}</li>
                                )}
                                <li>
                                    <strong>{t('status')}:</strong> {UserStatusEnum.getOptions(t).find(opt => opt.value === user.status)?.label || user.status}
                                </li>
                            </ul>
                            <div className="mt-2 d-flex flex-wrap gap-2">
                                {user.roles && user.roles.length > 0 && user.roles.map((role: any) => (
                                    <span key={role.id} className="badge profile-theme-bg">
                                        {RoleEnum.getOptions(t).find(opt => opt.value === role.role)?.label || role.role}
                                    </span>
                                ))}
                                {user.disciplines && user.disciplines.length > 0 && user.disciplines.map((disc: any) => (
                                    <span key={disc.id} className="badge bg-light text-dark border border-1 profile-theme-border">
                                        {DisciplineEnum.getOptions(t).find(opt => opt.value === disc.discipline)?.label || disc.discipline}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="text-end">
                            {isAdmin && !isMyProfile && (
                                <div className="mb-2">
                                    <select
                                        className="form-select mb-1 d-inline-block custom-select-md"
                                        value={selectedStatus === null ? user.status : selectedStatus}
                                        onChange={e => setSelectedStatus(Number(e.target.value))}
                                        disabled={statusLoading}
                                    >
                                        {UserStatusEnum.getOptions(t).map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <button
                                        className="btn btn-warning ms-2"
                                        onClick={handleChangeUserStatus}
                                        disabled={statusLoading || (selectedStatus === null || selectedStatus === user.status)}
                                    >
                                        {statusLoading ? t('loading') : t('changeStatus')}
                                    </button>
                                </div>
                            )}
                            {!isMyProfile && (
                                <>
                                    {!friendship && (
                                        <button className="btn btn-primary" onClick={handleAddFriend}>
                                            <i className="bi bi-person-plus me-2"></i>{t('addFriend')}
                                        </button>
                                    )}
                                    {friendship && (
                                        <div>
                                            <span className="badge bg-info text-dark mb-2">
                                                {t('friendshipStatus')}: {FriendStatusEnum.getOptions(t).find(opt => opt.value === friendship.status)?.label || friendship.status}
                                            </span>
                                            {(currentUser && (friendship.senderUserId === currentUser.id || friendship.receiverUserId === currentUser.id)) && (
                                                <form
                                                    className="d-inline-flex align-items-center ms-2"
                                                    onSubmit={e => {
                                                        e.preventDefault();
                                                        if (selectedFriendStatus !== null && selectedFriendStatus !== friendship.status) {
                                                            handleUpdateFriendStatus(selectedFriendStatus);
                                                        }
                                                    }}
                                                >
                                                    <select
                                                        className="form-select form-select-sm me-2 custom-select-sm"
                                                        value={typeof selectedFriendStatus === 'number' ? selectedFriendStatus : friendship.status}
                                                        onChange={e => setSelectedFriendStatus(Number(e.target.value))}
                                                    >
                                                        {FriendStatusEnum.getOptions(t).map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="submit"
                                                        className="btn btn-sm btn-warning"
                                                        disabled={selectedFriendStatus === null || selectedFriendStatus === friendship.status}
                                                    >
                                                        {t('changeStatus')}
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3 overflow-x-auto">
                {isMyProfile && (
                    <a href={`/users/${user.link}/settings`} className="btn btn-outline-primary">
                        <i className="bi bi-gear me-1"></i> {t('settings')}
                    </a>
                )}
                <a href={`/users/${user.link}/feeds`} className="btn btn-outline-primary">
                    <i className="bi bi-list-ul me-1"></i> {t('feeds')}
                </a>
                <a href={`/users/${user.link}/stories`} className="btn btn-outline-primary">
                    <i className="bi bi-collection-play me-1"></i> {t('stories')}
                </a>
                <a href={`/users/${user.link}/friends`} className="btn btn-outline-primary">
                    <i className="bi bi-people me-1"></i> {t('friends')}
                </a>
                <a href={`/users/${user.link}/goals`} className="btn btn-outline-primary">
                    <i className="bi bi-bullseye me-1"></i> {t('goals')}
                </a>
                <a href={`/users/${user.link}/pages`} className="btn btn-outline-primary">
                    <i className="bi bi-file-earmark-text me-1"></i> {t('pages')}
                </a>
                <a href={`/users/${user.link}/events`} className="btn btn-outline-primary">
                    <i className="bi bi-calendar-event me-1"></i> {t('events')}
                </a>
                <a href={`/users/${user.link}/trainings`} className="btn btn-outline-primary">
                    <i className="bi bi-bar-chart-steps me-1"></i> {t('trainings')}
                </a>
                {isMyProfile && (
                    <a href={`/users/${user.link}/notifications`} className="btn btn-outline-primary">
                        <i className="bi bi-bell me-1"></i> {t('notifications')}
                    </a>
                )}
                {isMyProfile && (
                    <a href={`/users/${user.link}/push-subscriptions`} className="btn btn-outline-primary">
                        <i className="bi bi-broadcast-pin me-1"></i> {t('pushSubscriptions')}
                    </a>
                )}
                <a href={`/users/${user.link}/conversations`} className="btn btn-outline-primary">
                    <i className="bi bi-chat-dots me-1"></i> {t('conversations')}
                </a>
            </div>
        </div>
    );
};