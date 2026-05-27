import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {UserResponse} from '../../api/responses/UserResponse';
import {FriendResponse} from '../../api/responses/FriendResponse';
import {ColorEnum} from '../../enums/ColorEnum';
import {UserProfileHeader} from './UserProfileHeader';
import {UserProfileNav} from './UserProfileNav';
import {UserProfileInfo} from './UserProfileInfo';
import {FriendStatusEnum} from '../../enums/FriendStatusEnum';

interface UserProfileViewProps {
    user: UserResponse | null;
    currentUser: UserResponse | null;
    friendship: FriendResponse | null;
    loading: boolean;
    error: string | null;
    handleAddFriend: () => void;
    handleUpdateFriendStatus: (status: number) => void;
    isMyProfile: boolean;
    isAdmin: boolean;
    onManageClick: (user: UserResponse) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
                                                                    user,
                                                                    currentUser,
                                                                    friendship,
                                                                    loading,
                                                                    error,
                                                                    handleAddFriend,
                                                                    handleUpdateFriendStatus,
                                                                    isMyProfile,
                                                                    isAdmin,
                                                                    onManageClick
                                                                }) => {
    const {t} = useTranslation();

    if (loading) return (
        <div className="container mt-5 text-center">
            <div className="spinner-border text-profile-primary"/>
        </div>
    );

    if (error || !user) return (
        <div className="container mt-5 alert alert-danger">
            {error ? t(error) : t('userNotFound')}
        </div>
    );

    const themeClass = ColorEnum.getClass(user.color);
    const canViewDetails = isMyProfile || isAdmin || friendship?.status === FriendStatusEnum.ACCEPTED;

    return (
        <div className={`container mt-4 mb-5 ${themeClass}`}>
            <UserProfileHeader
                user={user}
                currentUser={currentUser}
                friendship={friendship}
                isMyProfile={isMyProfile}
                isAdmin={isAdmin}
                handleAddFriend={handleAddFriend}
                handleUpdateFriendStatus={handleUpdateFriendStatus}
            />

            {canViewDetails && (
                <>
                    <UserProfileNav user={user} isMyProfile={isMyProfile}/>
                    <UserProfileInfo
                        user={user}
                        isMyProfile={isMyProfile}
                        isAdmin={isAdmin}
                        onManageClick={onManageClick}
                    />
                </>
            )}
        </div>
    );
};