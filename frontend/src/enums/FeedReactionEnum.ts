export enum FeedReactionEnum {
    LIKE = 1,
    LOVE = 2,
    HAHA = 3,
    WOW = 4,
    SAD = 5,
    ANGRY = 6,
}

export namespace FeedReactionEnum {
    export const getOptions = (t: (key: string) => string): { value: number; label: string }[] => {
        return Object.entries(FeedReactionEnum)
            .filter(([_, value]) => typeof value === 'number')
            .map(([key, value]) => ({
                value: value as number,
                label: t(`feedReactions.${key.toLowerCase()}`)
            }));
    };
}