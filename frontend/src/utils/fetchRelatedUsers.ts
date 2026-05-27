import { UserResponse } from '../api/responses/UserResponse';
import { UserProvider } from '../api/providers/UserProvider';
import { UserFilterQuery } from '../api/queries/UserFilterQuery';
import { UserIndexQuery } from '../api/queries/UserIndexQuery';

export async function fetchRelatedUsersFromIds(
    userIdsSet: Set<string>,
    currentMap: Record<string, UserResponse>,
    userProvider: UserProvider
): Promise<Record<string, UserResponse>> {
    const idsArray = Array.from(userIdsSet).filter(id => !currentMap[id]);
    if (idsArray.length === 0) return currentMap;

    const uFilter = new UserFilterQuery();
    uFilter.userIds = idsArray;
    const uIndexDto = new UserIndexQuery();
    uIndexDto.filter = uFilter;
    uIndexDto.limit = idsArray.length;

    const usersData = await userProvider.index(uIndexDto);

    const newMap = { ...currentMap };
    usersData.forEach(u => {
        newMap[u.id] = u;
    });

    return newMap;
}