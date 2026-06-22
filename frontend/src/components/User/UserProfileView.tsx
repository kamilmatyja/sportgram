import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {UserResponse} from '../../api/responses/UserResponse';
import {FriendResponse} from '../../api/responses/FriendResponse';
import {ColorEnum} from '../../enums/ColorEnum';
import {UserProfileHeader} from './UserProfileHeader';
import {UserProfileNav} from './UserProfileNav';
import {UserProfileInfo} from './UserProfileInfo';
import {FriendStatusEnum} from '../../enums/FriendStatusEnum';
import {Container, Spinner, Alert} from 'react-bootstrap';

interface UserProfileViewProps {
    user: UserResponse | null;
    currentUser: UserResponse | null;
    friendship: FriendResponse | null;
    loading: boolean;
    actionLoading: boolean;
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
                                                                    actionLoading,
                                                                    error,
                                                                    handleAddFriend,
                                                                    handleUpdateFriendStatus,
                                                                    isMyProfile,
                                                                    isAdmin,
                                                                    onManageClick
                                                                }) => {
    const {t} = useTranslation();

    if (loading) return (
        <Container className="mt-5 text-center">
            <Spinner animation="border" className="text-profile-primary" />
        </Container>
    );

    if (error || !user) return (
        <Container className="mt-5">
            <Alert variant="danger">{error ? t(error) : t('userNotFound')}</Alert>
        </Container>
    );

    const themeClass = ColorEnum.getClass(user.color);
    const canViewDetails = isMyProfile || isAdmin || friendship?.status === FriendStatusEnum.ACCEPTED;

    return (
        <Container className={`mt-4 mb-5 ${themeClass}`}>
            <UserProfileHeader
                user={user}
                currentUser={currentUser}
                friendship={friendship}
                isMyProfile={isMyProfile}
                isAdmin={isAdmin}
                handleAddFriend={handleAddFriend}
                handleUpdateFriendStatus={handleUpdateFriendStatus}
                actionLoading={actionLoading}
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
        </Container>
    );
};