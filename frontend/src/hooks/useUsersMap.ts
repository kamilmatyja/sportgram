import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService, type UserResource } from '../api/services';

export function useUsersMap(userIds: (string | undefined | null)[]) {
    const cleanIds = useMemo(() => Array.from(new Set(userIds.filter((id): id is string => !!id))), [userIds]);

    const { data: usersMap = {}, isLoading } = useQuery<Record<string, UserResource>>({
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
            return Object.fromEntries((res.data ?? []).map((u) => [u.id, u]));
        },
        enabled: cleanIds.length > 0,
    });

    return {
        usersMap,
        getUser: (id?: string | null) => (id ? usersMap[id] : undefined),
        isLoading,
    };
}
