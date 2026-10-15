import { FeedResponse } from '../api/responses/FeedResponse';

export const collectFeedUserIds = (feeds: FeedResponse[]): string[] =>
    feeds.flatMap((feed) => [
        feed.userId,
        ...(feed.comments?.map((c) => c.userId) || []),
        ...(feed.reactions?.map((r) => r.userId) || []),
    ]);
