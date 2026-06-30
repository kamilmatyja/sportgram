export enum PageFollowStatusEnum {
    PENDING = 1,
    ACCEPTED = 2,
    REJECTED = 3,
    UNFOLLOWED = 4,
}

export namespace PageFollowStatusEnum {
    export const getOptions = (t: (key: string) => string): { value: number; label: string }[] => {
        return Object.entries(PageFollowStatusEnum)
            .filter(([_, value]) => typeof value === 'number')
            .map(([key, value]) => ({
                value: value as number,
                label: t(`pageFollowStatuses.${key.toLowerCase()}`),
            }));
    };
}
