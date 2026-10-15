import { useState } from 'react';

import { UserResponse } from '../../api/responses/UserResponse';
import { fetchAcceptedFriendIds } from '../fetchFriends';
import { fetchRelatedUsers } from '../fetchRelatedUsers';

export function useAvailableFriends() {
    const [availableUsers, setAvailableUsers] = useState<UserResponse[]>([]);

    const loadAvailableFriends = async (currentUser: UserResponse | null, extraUserIds: string[] = []) => {
        if (!currentUser) return;
        const friendIds = await fetchAcceptedFriendIds(currentUser.id);
        const users = await fetchRelatedUsers([...friendIds, ...extraUserIds]);
        setAvailableUsers(Object.values(users));
    };

    return { availableUsers, loadAvailableFriends };
}
