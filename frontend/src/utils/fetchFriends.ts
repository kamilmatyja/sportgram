import { FriendProvider } from '../api/providers/FriendProvider';
import { FriendFilterQuery } from '../api/queries/FriendFilterQuery';
import { FriendIndexQuery } from '../api/queries/FriendIndexQuery';
import { FriendStatusEnum } from '../enums/FriendStatusEnum';
import { fetchAllPages } from './query';

export async function fetchAcceptedFriendIds(userId: string): Promise<string[]> {
    const filter = new FriendFilterQuery();
    filter.userIds = [userId];
    filter.status = FriendStatusEnum.ACCEPTED;
    const indexDto = new FriendIndexQuery();
    indexDto.filter = filter;

    const friendProvider = new FriendProvider();
    const friends = await fetchAllPages(indexDto, (query) => friendProvider.index(query));

    return friends.map((f) => (f.senderUserId === userId ? f.receiverUserId : f.senderUserId));
}
