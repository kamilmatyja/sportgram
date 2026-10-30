import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { friendService, type UserResource } from '../api/services';
import { FriendStatusEnum } from '../enums/FriendStatusEnum';
import { RoleEnum } from '../enums/RoleEnum';

export interface UseUserSubpageAccessOptions {
    targetUser?: UserResource | null;
    requiredRole?: RoleEnum;
    ownerOrAdminOnly?: boolean;
}

export function useUserSubpageAccess({
    targetUser,
    requiredRole,
    ownerOrAdminOnly = false,
}: UseUserSubpageAccessOptions) {
    const { currentUser, isAdmin } = useAuth();
    const isOwner = !!(currentUser?.id && targetUser?.id && currentUser.id === targetUser.id);

    const { data: friendData, isLoading: isFriendLoading } = useQuery({
        queryKey: ['friend-relation', targetUser?.id, currentUser?.id],
        queryFn: async () => {
            if (!targetUser?.id || !currentUser?.id || isOwner) return null;
            const res = await friendService.getFriends({
                filter: { userIds: [targetUser.id] },
                limit: 10,
            });
            const match = res.data?.find(
                (f) =>
                    (f.senderUserId === currentUser.id && f.receiverUserId === targetUser.id) ||
                    (f.senderUserId === targetUser.id && f.receiverUserId === currentUser.id),
            );
            return match ?? null;
        },
        enabled: !!targetUser?.id && !!currentUser?.id && !isOwner && !ownerOrAdminOnly,
    });

    const isAcceptedFriend = friendData?.status === FriendStatusEnum.ACCEPTED;
    const canAccessSubpage = ownerOrAdminOnly ? isOwner || isAdmin : isOwner || isAdmin || isAcceptedFriend;

    const targetRoles = targetUser?.roles?.map((r) => r.role) ?? [];
    const hasRequiredRole = requiredRole ? targetRoles.includes(requiredRole) : true;

    return {
        isOwner,
        isAdmin,
        isAcceptedFriend,
        canAccessSubpage,
        hasRequiredRole,
        isLoading: isFriendLoading,
    };
}
