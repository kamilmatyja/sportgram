import { useQuery } from '@tanstack/react-query';
import { friendService, type UserResource } from '../api/services';
import { useAuth } from '../auth';
import { FriendStatusEnum } from '../enums/FriendStatusEnum';
import type { RoleEnum } from '../enums/RoleEnum';

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
                params: {
                    query: {
                        filter: { userIds: [targetUser.id] },
                        limit: 10,
                    },
                },
            });
            return (
                res.data?.find(
                    (f) =>
                        (f.senderUserId === currentUser.id && f.receiverUserId === targetUser.id) ||
                        (f.senderUserId === targetUser.id && f.receiverUserId === currentUser.id),
                ) ?? null
            );
        },
        enabled: !!targetUser?.id && !!currentUser?.id && !isOwner && !ownerOrAdminOnly,
    });

    const isAcceptedFriend = friendData?.status === FriendStatusEnum.ACCEPTED;
    const canAccessSubpage = isOwner || isAdmin || (!ownerOrAdminOnly && isAcceptedFriend);
    const hasRequiredRole = !requiredRole || (targetUser?.roles?.some((r) => r.role === requiredRole) ?? false);

    return {
        isOwner,
        isAdmin,
        isAcceptedFriend,
        canAccessSubpage,
        hasRequiredRole,
        isLoading: isFriendLoading,
    };
}
