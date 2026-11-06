import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService, type UserResource } from '../api/services';

export function useUsersMap(userIds: (string | undefined | null)[]) {
    const cleanIds = useMemo(() => {
        const set = new Set<string>();
        for (const id of userIds) {
            if (id) set.add(id);
        }
        return Array.from(set);
    }, [userIds]);

    const { data, isLoading } = useQuery({
        queryKey: ['users-map', cleanIds],
        queryFn: async () => {
            if (cleanIds.length === 0) return {};
            const res = await userService.getUsers({
                params: {
                    query: {
                        filter: { userIds: cleanIds },
                        limit: 100,
                    },
                },
            });
            const users = res.data ?? [];
            const map: Record<string, UserResource> = {};
            users.forEach((u) => {
                map[u.id] = u;
            });
            return map;
        },
        enabled: cleanIds.length > 0,
    });

    const usersMap = data ?? {};

    return {
        usersMap,
        getUser: (id?: string | null) => (id ? usersMap[id] : undefined),
        isLoading,
    };
}
