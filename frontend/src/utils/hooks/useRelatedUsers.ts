import { useRef, useState } from 'react';

import { UserResponse } from '../../api/responses/UserResponse';
import { fetchRelatedUsers } from '../fetchRelatedUsers';

export function useRelatedUsers() {
    const [relatedUsers, setRelatedUsers] = useState<Record<string, UserResponse>>({});
    const cache = useRef(relatedUsers);

    const loadRelatedUsers = async (userIds: string[]) => {
        const users = await fetchRelatedUsers(userIds, cache.current);
        cache.current = { ...cache.current, ...users };
        setRelatedUsers((prev) => ({ ...prev, ...users }));
        return cache.current;
    };

    return { relatedUsers, loadRelatedUsers };
}
