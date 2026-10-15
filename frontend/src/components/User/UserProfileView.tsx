import React from 'react';
import { Container } from 'react-bootstrap';

import { UserProfileHeader } from './UserProfileHeader';
import { UserProfileInfo } from './UserProfileInfo';
import { UserProfileNav } from './UserProfileNav';
import { FriendResponse } from '../../api/responses/FriendResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { ColorEnum } from '../../enums/ColorEnum';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { ErrorView, LoadingView } from '../Common/ViewState';

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
    const { user, loading, error, isMyProfile, isAdmin, friendship } = props;

    if (loading) return <LoadingView />;
    if (error || !user) return <ErrorView error={error || 'userNotFound'} />;

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
