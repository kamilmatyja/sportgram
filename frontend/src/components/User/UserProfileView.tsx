import React from 'react';
import { Container, Spinner, Alert } from 'react-bootstrap';

import { UserProfileHeader } from './UserProfileHeader';
import { UserProfileInfo } from './UserProfileInfo';
import { UserProfileNav } from './UserProfileNav';
import { FriendResponse } from '../../api/responses/FriendResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';

interface UserProfileViewProps {
    user: UserResponse | null;
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

export const UserProfileView: React.FC<UserProfileViewProps> = (props) => {
    const { t } = useTranslation();
    const { user, loading, error, isMyProfile, isAdmin, friendship } = props;

    if (loading)
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    if (error || !user)
        return (
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
                friendship={friendship}
                isMyProfile={isMyProfile}
                handleAddFriend={props.handleAddFriend}
                handleUpdateFriendStatus={props.handleUpdateFriendStatus}
                actionLoading={props.actionLoading}
            />
            {canViewDetails && (
                <>
                    <UserProfileNav user={user} isMyProfile={isMyProfile} />
                    <UserProfileInfo
                        user={user}
                        isMyProfile={isMyProfile}
                        isAdmin={isAdmin}
                        onManageClick={props.onManageClick}
                    />
                </>
            )}
        </Container>
    );
};
