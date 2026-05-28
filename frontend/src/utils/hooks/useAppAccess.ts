import { useEffect, useState } from 'react';
import { UserProvider } from '../../api/providers/UserProvider';
import { FriendProvider } from '../../api/providers/FriendProvider';
import { useAuth } from '../../context/AuthContext';
import { RoleEnum } from '../../enums/RoleEnum';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { UserIndexQuery } from '../../api/queries/UserIndexQuery';
import { UserFilterQuery } from '../../api/queries/UserFilterQuery';
import { FriendIndexQuery } from '../../api/queries/FriendIndexQuery';
import { FriendFilterQuery } from '../../api/queries/FriendFilterQuery';
import { UserResponse } from '../../api/responses/UserResponse';
import { FriendResponse } from '../../api/responses/FriendResponse';

interface AppAccessOptions {
    targetLink?: string;
    targetId?: string;
    requireFriendship?: boolean;
    requireOwner?: boolean;
}

export function useAppAccess({ targetLink, targetId, requireFriendship, requireOwner }: AppAccessOptions = {}) {
    const { signId } = useAuth();

    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [targetUser, setTargetUser] = useState<UserResponse | null>(null);
    const [friendship, setFriendship] = useState<FriendResponse | null>(null);

    const [roles, setRoles] = useState({
        isAdmin: false,
        isOrganizer: false,
        isParticipant: false,
        isMyProfile: false,
        isFriend: false,
    });

    const [authLoading, setAuthLoading] = useState<boolean>(true);
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        const initAccess = async () => {
            setAuthLoading(true);
            setAuthError(null);
            try {
                if (!signId) throw { error: 'unauthorizedEdit' };

                const userProvider = new UserProvider();
                const friendProvider = new FriendProvider();

                const uFilter = new UserFilterQuery();
                uFilter.signId = signId;
                const uIndex = new UserIndexQuery();
                uIndex.limit = 1;
                uIndex.filter = uFilter;
                uIndex.include = ['userRoles', 'userDisciplines'];

                const currentUserArr = await userProvider.index(uIndex);
                if (currentUserArr.length === 0) throw { error: 'unauthorizedEdit' };

                const currentUsr = currentUserArr[0];
                setCurrentUser(currentUsr);

                const isAdmin = currentUsr.roles?.some((r: any) => r.role === RoleEnum.ADMINISTRATOR) ?? false;
                const isOrganizer = currentUsr.roles?.some((r: any) => r.role === RoleEnum.ORGANIZER) ?? false;
                const isParticipant = currentUsr.roles?.some((r: any) => r.role === RoleEnum.PARTICIPANT) ?? false;

                if (!targetLink && !targetId) {
                    setRoles({ isAdmin, isOrganizer, isParticipant, isMyProfile: false, isFriend: false });
                    return;
                }

                let tUser: UserResponse;
                if (targetLink) {
                    const tFilter = new UserFilterQuery();
                    tFilter.link = targetLink;
                    const tIndex = new UserIndexQuery();
                    tIndex.filter = tFilter;
                    tIndex.include = ['userRoles', 'userDisciplines'];
                    const targetUsers = await userProvider.index(tIndex);
                    if (targetUsers.length === 0) throw { error: 'userNotFound' };
                    tUser = targetUsers[0];
                } else if (targetId) {
                    tUser = await userProvider.details(targetId, ['userRoles', 'userDisciplines']);
                } else {
                    throw { error: 'userNotFound' };
                }
                setTargetUser(tUser);

                const isMyProfile = currentUsr.id === tUser.id;
                let isFriend = false;
                let foundFriendship = null;

                if (!isMyProfile) {
                    const fFilter = new FriendFilterQuery();
                    fFilter.userIds = [tUser.id, currentUsr.id];
                    const fIndex = new FriendIndexQuery();
                    fIndex.filter = fFilter;
                    const friends = await friendProvider.index(fIndex);

                    foundFriendship = friends.find(f =>
                        (f.senderUserId === tUser.id && f.receiverUserId === currentUsr.id) ||
                        (f.senderUserId === currentUsr.id && f.receiverUserId === tUser.id)
                    ) || null;

                    isFriend = foundFriendship?.status === FriendStatusEnum.ACCEPTED;
                    setFriendship(foundFriendship);
                }

                if (requireOwner && !isMyProfile && !isAdmin) {
                    throw { error: 'accessDenied' };
                }

                if (requireFriendship && !isMyProfile && !isAdmin && !isFriend) {
                    throw { error: 'accessDenied' };
                }

                setRoles({ isAdmin, isOrganizer, isParticipant, isMyProfile, isFriend });

            } catch (err: any) {
                setAuthError(err.error);
            } finally {
                setAuthLoading(false);
            }
        };

        initAccess();
    }, [targetLink, targetId, requireFriendship, requireOwner, signId]);

    return {
        currentUser, targetUser, friendship,
        ...roles,
        authLoading, authError
    };
}