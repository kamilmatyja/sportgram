import React, {useState, useRef, useEffect} from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {UserResponse} from '../../api/responses/UserResponse';
import {FriendResponse} from '../../api/responses/FriendResponse';
import {FriendStatusEnum} from '../../enums/FriendStatusEnum';

interface UserProfileHeaderProps {
    user: UserResponse;
    currentUser: UserResponse | null;
    friendship: FriendResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    handleAddFriend: () => void;
    handleUpdateFriendStatus: (status: number) => void;
    actionLoading: boolean;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
                                                                        user,
                                                                        currentUser,
                                                                        friendship,
                                                                        isMyProfile,
                                                                        handleAddFriend,
                                                                        handleUpdateFriendStatus,
                                                                        actionLoading
                                                                    }) => {
    const {t} = useTranslation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="card shadow-sm mb-4">
            <div
                className="card-img-top bg-secondary position-relative overflow-hidden border-top border-4 profile-theme-border profile-bg-container">
                {user.backgroundPhoto && (
                    <img src={`data:image/webp;base64,${user.backgroundPhoto}`} alt="Background"
                         className="w-100 h-100 object-fit-cover"/>
                )}
            </div>
            <div
                className="card-body position-relative pt-5 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3">
                <div>
                    {user.profilePhoto ? (
                        <img src={`data:image/webp;base64,${user.profilePhoto}`} alt="Profile"
                             className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar object-fit-cover"/>
                    ) : (
                        <div
                            className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar d-flex align-items-center justify-content-center">
                            <i className="bi bi-person fs-1 text-muted"></i>
                        </div>
                    )}
                    <div className="mt-4 mt-md-3">
                        <h2 className="mb-0 profile-theme-text fw-bold">{user.firstName} {user.lastName}</h2>
                        <p className="text-muted mb-0">@{user.link}</p>
                    </div>
                </div>

                <div className="d-flex flex-wrap gap-2 align-items-center">
                    {!isMyProfile && !friendship && (
                        <button className="btn btn-profile-outline-primary" onClick={handleAddFriend} disabled={actionLoading}>
                            {actionLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-person-plus me-1"></i>}
                            {t('addFriend')}
                        </button>
                    )}

                    {!isMyProfile && friendship && (
                        <div className="dropdown" ref={dropdownRef}>
                            <button
                                className="btn btn-profile-outline-primary dropdown-toggle"
                                type="button"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                disabled={actionLoading}
                            >
                                {actionLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                                {t('status')}: {FriendStatusEnum.getOptions(t).find(opt => opt.value === friendship.status)?.label}
                            </button>
                            <ul className={`dropdown-menu dropdown-menu-end ${dropdownOpen ? 'show' : ''}`}>
                                {(friendship.senderUserId === currentUser?.id || friendship.receiverUserId === currentUser?.id) && (
                                    FriendStatusEnum.getNanoOptions(t).map(opt => (
                                        opt.value !== friendship.status && (
                                            <li key={opt.value}>
                                                <button className="dropdown-item"
                                                        onClick={() => {
                                                            setDropdownOpen(false);
                                                            handleUpdateFriendStatus(opt.value);
                                                        }}>
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