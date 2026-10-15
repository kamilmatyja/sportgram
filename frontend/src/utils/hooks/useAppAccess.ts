import { useEffect, useState, useCallback, useRef } from 'react';

import { FriendProvider } from '../../api/providers/FriendProvider';
import { UserProvider } from '../../api/providers/UserProvider';
import { FriendFilterQuery } from '../../api/queries/FriendFilterQuery';
import { FriendIndexQuery } from '../../api/queries/FriendIndexQuery';
import { UserFilterQuery } from '../../api/queries/UserFilterQuery';
import { UserIndexQuery } from '../../api/queries/UserIndexQuery';
import { FriendResponse } from '../../api/responses/FriendResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useAuth } from '../../context/AuthContext';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { getErrorMessage } from '../api';

interface AppAccessOptions {
    targetLink?: string;
    targetId?: string;
    requireFriendship?: boolean;
    requireOwner?: boolean;
}

export const isAccessReady = (access: { authLoading: boolean; authError: string | null }) =>
    !access.authLoading && !access.authError;

const emptyRoles = {
    isAdmin: false,
    isOrganizer: false,
    isParticipant: false,
    isMyProfile: false,
    isFriend: false,
};

export function useAppAccess({ targetLink, targetId, requireFriendship, requireOwner }: AppAccessOptions = {}) {
    const { signId } = useAuth();

    const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
    const [targetUser, setTargetUser] = useState<UserResponse | null>(null);
    const [friendship, setFriendship] = useState<FriendResponse | null>(null);

    const [roles, setRoles] = useState(emptyRoles);

    const [authLoading, setAuthLoading] = useState<boolean>(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const requestIdRef = useRef<number>(0);

    const refreshAccess = useCallback(async () => {
        const requestId = ++requestIdRef.current;
        const isLatest = () => requestId === requestIdRef.current;

        setAuthLoading(true);
        setAuthError(null);
        setTargetUser(null);
        setFriendship(null);
        setRoles(emptyRoles);
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

            const currentUserArr = (await userProvider.index(uIndex)).data;
            if (currentUserArr.length === 0) throw { error: 'unauthorizedEdit' };

            const currentUsr = currentUserArr[0];

            const isAdmin = currentUsr.roles?.some((r: any) => r.role === RoleEnum.ADMINISTRATOR) ?? false;
            const isOrganizer = currentUsr.roles?.some((r: any) => r.role === RoleEnum.ORGANIZER) ?? false;
            const isParticipant = currentUsr.roles?.some((r: any) => r.role === RoleEnum.PARTICIPANT) ?? false;

            if (!targetLink && !targetId) {
                if (!isLatest()) return;
                setCurrentUser(currentUsr);
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
                const targetUsers = (await userProvider.index(tIndex)).data;
                if (targetUsers.length === 0) throw { error: 'userNotFound' };
                tUser = targetUsers[0];
            } else {
                tUser = await userProvider.details(targetId!, ['userRoles', 'userDisciplines']);
            }

            const isMyProfile = currentUsr.id === tUser.id;
            let isFriend = false;
            let foundFriendship: FriendResponse | null = null;

            if (!isMyProfile) {
                const fFilter = new FriendFilterQuery();
                fFilter.userIds = [tUser.id, currentUsr.id];
                const fIndex = new FriendIndexQuery();
                fIndex.filter = fFilter;
                const friends = (await friendProvider.index(fIndex)).data;

                foundFriendship =
                    friends.find(
                        (f) =>
                            (f.senderUserId === tUser.id && f.receiverUserId === currentUsr.id) ||
                            (f.senderUserId === currentUsr.id && f.receiverUserId === tUser.id),
                    ) || null;

                isFriend = foundFriendship?.status === FriendStatusEnum.ACCEPTED;
            }

            if (requireOwner && !isMyProfile && !isAdmin) {
                throw { error: 'accessDenied' };
            }

            if (requireFriendship && !isMyProfile && !isAdmin && !isFriend) {
                throw { error: 'accessDenied' };
            }

            if (!isLatest()) return;
            setCurrentUser(currentUsr);
            setTargetUser(tUser);
            setFriendship(foundFriendship);
            setRoles({ isAdmin, isOrganizer, isParticipant, isMyProfile, isFriend });
        } catch (err: unknown) {
            if (!isLatest()) return;
            setAuthError(getErrorMessage(err));
        } finally {
            if (isLatest()) setAuthLoading(false);
        }
    }, [targetLink, targetId, requireFriendship, requireOwner, signId]);

    useEffect(() => {
        refreshAccess();
    }, [refreshAccess]);

    return {
        currentUser,
        targetUser,
        friendship,
        ...roles,
        authLoading,
        authError,
        refreshAccess,
    };
}
