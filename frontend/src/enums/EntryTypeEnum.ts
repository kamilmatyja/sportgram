export enum EntryTypeEnum {
    USER = 1,
    STORY = 2,
    CONVERSATION = 3,
    FEED = 4,
    GOAL = 5,
    PAGE = 6,
    EVENT = 7,
    TRAINING = 8,
}

export namespace EntryTypeEnum {
    export const getOptions = (t: (key: string) => string): { value: number; label: string }[] => {
        return Object.entries(EntryTypeEnum)
            .filter(([_, value]) => typeof value === 'number')
            .map(([key, value]) => ({
                value: value as number,
                label: t(`entryTypes.${key.toLowerCase()}`)
            }));
    };
}