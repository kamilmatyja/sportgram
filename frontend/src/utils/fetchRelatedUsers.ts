import {UserResponse} from '../api/responses/UserResponse';
import {UserProvider} from '../api/providers/UserProvider';
import {UserFilterQuery} from '../api/queries/UserFilterQuery';
import {UserIndexQuery} from '../api/queries/UserIndexQuery';

export async function fetchRelatedUsers(
    userIds: string[],
    currentMap: Record<string, UserResponse>,
    userProvider: UserProvider
): Promise<Record<string, UserResponse>> {
    const idsToFetch = Array.from(new Set(userIds)).filter(id => !currentMap[id]);

    if (idsToFetch.length === 0) return currentMap;

    const uFilter = new UserFilterQuery();
    uFilter.userIds = idsToFetch;

    const uIndexDto = new UserIndexQuery();
    uIndexDto.filter = uFilter;
    uIndexDto.limit = idsToFetch.length;

    const usersData = await userProvider.index(uIndexDto);

    const newMap = { ...currentMap };
    usersData.forEach(u => {
        newMap[u.id] = u;
    });

    return newMap;
}