import { getEnumOptions } from '../utils';

export enum FeedReactionEnum {
    LIKE = 1,
    LOVE = 2,
    HAHA = 3,
    WOW = 4,
    SAD = 5,
    ANGRY = 6,
}

export namespace FeedReactionEnum {
    export const getOptions = (t: (key: string) => string) => getEnumOptions(FeedReactionEnum, 'feedReactions', t);

    export const ALL_REACTIONS = [
        { type: FeedReactionEnum.LIKE, emoji: '👍', key: 'like' },
        { type: FeedReactionEnum.LOVE, emoji: '❤️', key: 'love' },
        { type: FeedReactionEnum.HAHA, emoji: '😂', key: 'haha' },
        { type: FeedReactionEnum.WOW, emoji: '😮', key: 'wow' },
        { type: FeedReactionEnum.SAD, emoji: '😢', key: 'sad' },
        { type: FeedReactionEnum.ANGRY, emoji: '😡', key: 'angry' },
    ];

    export const getEmoji = (reaction: FeedReactionEnum | number): string => {
        return ALL_REACTIONS.find((r) => r.type === reaction)?.emoji ?? '👍';
    };

    export const getKey = (reaction: FeedReactionEnum | number): string => {
        return ALL_REACTIONS.find((r) => r.type === reaction)?.key ?? 'like';
    };

    export const getLabel = (reaction: FeedReactionEnum | number, t: (key: string) => string): string => {
        const key = getKey(reaction);
        return t(`feedReactions.${key}`);
    };
}
