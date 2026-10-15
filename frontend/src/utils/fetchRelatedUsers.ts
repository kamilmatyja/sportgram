import { UserProvider } from '../api/providers/UserProvider';
import { UserFilterQuery } from '../api/queries/UserFilterQuery';
import { UserIndexQuery } from '../api/queries/UserIndexQuery';
import { UserResponse } from '../api/responses/UserResponse';
import { PaginationEnum } from '../enums/PaginationEnum';

export async function fetchRelatedUsers(
    userIds: string[],
    currentMap: Record<string, UserResponse> = {},
): Promise<Record<string, UserResponse>> {
    const idsToFetch = Array.from(new Set(userIds)).filter((id) => !currentMap[id]);

    if (idsToFetch.length === 0) return currentMap;

    const userProvider = new UserProvider();
    const chunks: string[][] = [];
    for (let i = 0; i < idsToFetch.length; i += PaginationEnum.LG) {
        chunks.push(idsToFetch.slice(i, i + PaginationEnum.LG));
    }

    const responses = await Promise.all(
        chunks.map((chunk) => {
            const uFilter = new UserFilterQuery();
            uFilter.userIds = chunk;

            const uIndexDto = new UserIndexQuery();
            uIndexDto.filter = uFilter;
            uIndexDto.limit = chunk.length;

            return userProvider.index(uIndexDto);
        }),
    );

    const newMap = { ...currentMap };
    responses.forEach((response) =>
        response.data.forEach((u) => {
            newMap[u.id] = u;
        }),
    );

    return newMap;
}
