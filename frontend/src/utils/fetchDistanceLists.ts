import { EventProvider } from '../api/providers/EventProvider';
import { EVENT_LIST_INCLUDES } from '../api/queries/includes';
import { EventListIndexQuery } from '../api/queries/EventListIndexQuery';
import { EventDisciplineDistanceListResponse } from '../api/responses/EventDisciplineDistanceListResponse';
import { UserResponse } from '../api/responses/UserResponse';
import { PaginationEnum } from '../enums/PaginationEnum';
import { fetchRelatedUsers } from './fetchRelatedUsers';

export async function fetchDistanceLists(
    distanceId: string,
    knownUsers: Record<string, UserResponse> = {},
): Promise<{ lists: EventDisciplineDistanceListResponse[]; users: Record<string, UserResponse> }> {
    const indexDto = new EventListIndexQuery();
    indexDto.limit = PaginationEnum.LG;
    indexDto.include = EVENT_LIST_INCLUDES;
    const lists = (await new EventProvider().indexList(distanceId, indexDto)).data;

    const users = await fetchRelatedUsers(
        lists.map((l) => l.userId),
        knownUsers,
    );

    return { lists, users };
}
