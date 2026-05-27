import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { UserResponse } from '../../api/responses/UserResponse';
import { FriendResponse } from '../../api/responses/FriendResponse';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';

interface UserProfileHeaderProps {
    user: UserResponse;
    currentUser: UserResponse | null;
    friendship: FriendResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    onManageClick: (user: UserResponse) => void;
    handleAddFriend: () => void;
    handleUpdateFriendStatus: (status: number) => void;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
                                                                        user, currentUser, friendship, isMyProfile, isAdmin, onManageClick, handleAddFriend, handleUpdateFriendStatus
                                                                    }) => {
    const { t } = useTranslation();

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-img-top bg-secondary position-relative overflow-hidden border-top border-4 profile-theme-border profile-bg-container">
                {user.backgroundPhoto && (
                    <img src={`data:image/webp;base64,${user.backgroundPhoto}`} alt="Background" className="w-100 h-100 object-fit-cover" />
                )}
            </div>
            <div className="card-body position-relative pt-5 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3">
                <div>
                    {user.profilePhoto ? (
                        <img src={`data:image/webp;base64,${user.profilePhoto}`} alt="Profile" className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar object-fit-cover" />
                    ) : (
                        <div className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar d-flex align-items-center justify-content-center">
                            <i className="bi bi-person fs-1 text-muted"></i>
                        </div>
                    )}
                    <div className="mt-4 mt-md-3">
                        <h2 className="mb-0 profile-theme-text fw-bold">{user.firstName} {user.lastName}</h2>
                        <p className="text-muted mb-0">@{user.link}</p>
                    </div>
                </div>

                <div className="d-flex flex-wrap gap-2 align-items-center">
                    {(isMyProfile || isAdmin) && (
                        <button className="btn btn-profile-primary" onClick={() => onManageClick(user)}>
                            <i className="bi bi-gear me-1"></i> {t('manage')}
                        </button>
                    )}

                    {!isMyProfile && !friendship && (
                        <button className="btn btn-profile-outline-primary" onClick={handleAddFriend}>
                            <i className="bi bi-person-plus me-1"></i> {t('addFriend')}
                        </button>
                    )}

                    {!isMyProfile && friendship && (
                        <div className="dropdown">
                            <button className="btn btn-profile-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                {t('friendshipStatus')}: {FriendStatusEnum.getOptions(t).find(opt => opt.value === friendship.status)?.label}
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                                {(friendship.senderUserId === currentUser?.id || friendship.receiverUserId === currentUser?.id) && (
                                    FriendStatusEnum.getNanoOptions(t).map(opt => (
                                        opt.value !== friendship.status && (
                                            <li key={opt.value}>
                                                <button className="dropdown-item" onClick={() => handleUpdateFriendStatus(opt.value)}>
                                                    {opt.label}
                                                </button>
                                            </li>
                                        )
                                    ))
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};