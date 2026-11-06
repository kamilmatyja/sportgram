import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { friendService, userService, type UserResource } from '../api/services';
import { FriendStatusEnum } from '../enums/FriendStatusEnum';
import { useAuth } from '../auth/AuthContext';

export interface CollaboratorOption {
    value: string;
    label: string;
}

export function useMyFriends(extraUserIds?: (string | undefined | null)[]) {
    const { currentUser } = useAuth();

    const { data: friends = [], isLoading: friendsLoading } = useQuery({
        queryKey: ['my-friends-accepted-users', currentUser?.id],
        queryFn: async () => {
            if (!currentUser?.id) return [];
            const res = await friendService.getFriends({
                params: {
                    query: {
                        filter: { userIds: [currentUser.id], status: FriendStatusEnum.ACCEPTED },
                        limit: 100,
                    },
                },
            });
            const partnerIds = (res.data ?? []).map((f) =>
                f.senderUserId === currentUser.id ? f.receiverUserId : f.senderUserId,
            );
            if (partnerIds.length === 0) return [];
            const uRes = await userService.getUsers({
                params: {
                    query: {
                        filter: { userIds: partnerIds },
                        limit: 100,
                    },
                },
            });
            return uRes.data ?? [];
        },
        enabled: !!currentUser?.id,
    });

    const extraIds = useMemo(() => {
        if (!extraUserIds || extraUserIds.length === 0) return [];
        const set = new Set<string>();
        for (const id of extraUserIds) {
            if (id && id !== currentUser?.id) set.add(id);
        }
        return Array.from(set);
    }, [extraUserIds, currentUser?.id]);

    const { data: extraUsers = [], isLoading: extraLoading } = useQuery({
        queryKey: ['extra-collaborator-users', extraIds],
        queryFn: async () => {
            if (extraIds.length === 0) return [];
            const uRes = await userService.getUsers({
                params: {
                    query: {
                        filter: { userIds: extraIds },
                        limit: 100,
                    },
                },
            });
            return uRes.data ?? [];
        },
        enabled: extraIds.length > 0,
    });

    const collaboratorOptions = useMemo<CollaboratorOption[]>(() => {
        const map = new Map<string, UserResource>();
        friends.forEach((u) => map.set(u.id, u));
        extraUsers.forEach((u) => map.set(u.id, u));
        return Array.from(map.values()).map((u) => ({
            value: u.id,
            label: `${u.firstName} ${u.lastName} (@${u.link})`,
        }));
    }, [friends, extraUsers]);

    return {
        friends,
        collaboratorOptions,
        isLoading: friendsLoading || extraLoading,
    };
}
