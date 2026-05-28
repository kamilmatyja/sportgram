import { UserProvider } from '../api/providers/UserProvider';
import { FriendProvider } from '../api/providers/FriendProvider';
import { useCheckPermission } from './checkPermission';
import { RoleEnum } from '../enums/RoleEnum';
import { FriendStatusEnum } from '../enums/FriendStatusEnum';
import { UserFilterQuery } from '../api/queries/UserFilterQuery';
import { UserIndexQuery } from '../api/queries/UserIndexQuery';
import { FriendFilterQuery } from '../api/queries/FriendFilterQuery';
import { FriendIndexQuery } from '../api/queries/FriendIndexQuery';

interface AccessOptions {
    requireFriendship?: boolean;
    requireOwner?: boolean;
}

export function profileAccess() {
    const { getCurrentUser } = useCheckPermission();
    const userProvider = new UserProvider();
    const friendProvider = new FriendProvider();

    const checkAccess = async (
        targetUserIdentifier: { link?: string; id?: string },
        options: AccessOptions = {}
    ) => {
        const currentUsr = await getCurrentUser();

        if (!currentUsr) {
            throw { error: 'unauthorizedEdit' };
        }

        const isAdmin = currentUsr.roles?.some((r: any) => r.role === RoleEnum.ADMINISTRATOR) ?? false;
        const isParticipant = currentUsr.roles?.some((r: any) => r.role === RoleEnum.PARTICIPANT) ?? false;
        const isOrganizer = currentUsr.roles?.some((r: any) => r.role === RoleEnum.ORGANIZER) ?? false;

        let targetUser;

        if (targetUserIdentifier.link) {
            const uFilter = new UserFilterQuery();
            uFilter.link = targetUserIdentifier.link;
            const uIndexDto = new UserIndexQuery();
            uIndexDto.filter = uFilter;
            const targetUsers = await userProvider.index(uIndexDto);

            if (targetUsers.length === 0) {
                throw { error: 'userNotFound' };
            }
            targetUser = await userProvider.details(targetUsers[0].id, ['userRoles', 'userDisciplines']);
        } else if (targetUserIdentifier.id) {
            targetUser = await userProvider.details(targetUserIdentifier.id, ['userRoles', 'userDisciplines']);
        } else {
            throw { error: 'userNotFound' };
        }

        const isMyProfile = currentUsr.id === targetUser.id;
        let isFriend = false;
        let friendship = null;

        if (!isMyProfile) {
            const fFilter = new FriendFilterQuery();
            fFilter.userIds = [targetUser.id, currentUsr.id];
            const fIndexDto = new FriendIndexQuery();
            fIndexDto.filter = fFilter;
            const friends = await friendProvider.index(fIndexDto);

            friendship = friends.find(f =>
                (f.senderUserId === targetUser.id && f.receiverUserId === currentUsr.id) ||
                (f.senderUserId === currentUsr.id && f.receiverUserId === targetUser.id)
            ) || null;

            isFriend = friendship?.status === FriendStatusEnum.ACCEPTED;
        }

        if (options.requireOwner && !isMyProfile && !isAdmin) {
            throw { error: 'accessDenied' };
        }

        if (options.requireFriendship && !isMyProfile && !isAdmin && !isFriend) {
            throw { error: 'accessDenied' };
        }

        return {
            currentUser: currentUsr,
            targetUser,
            isAdmin,
            isParticipant,
            isOrganizer,
            isMyProfile,
            isFriend,
            friendship
        };
    };

    return { checkAccess };
}