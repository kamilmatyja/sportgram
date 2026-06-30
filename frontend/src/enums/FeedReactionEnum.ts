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
                label: t(`feedReactions.${key.toLowerCase()}`),
            }));
    };

    export const getClass = (type: number): { name: string; className: string } => {
        switch (type) {
            case FeedReactionEnum.LIKE:
                return { name: 'hand-thumbs-up-fill', className: 'text-profile-primary' };
            case FeedReactionEnum.LOVE:
                return { name: 'heart-fill', className: 'text-danger' };
            case FeedReactionEnum.HAHA:
                return { name: 'emoji-laughing-fill', className: 'text-warning' };
            case FeedReactionEnum.WOW:
                return { name: 'emoji-surprise-fill', className: 'text-warning' };
            case FeedReactionEnum.SAD:
                return { name: 'emoji-frown-fill', className: 'text-warning' };
            case FeedReactionEnum.ANGRY:
                return { name: 'emoji-angry-fill', className: 'text-danger' };
            default:
                return { name: 'hand-thumbs-up', className: '' };
        }
    };
}
