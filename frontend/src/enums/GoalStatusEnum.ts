export enum GoalStatusEnum {
    DRAFT = 1,
    ACTIVE = 2,
    COMPLETED = 3,
    REJECTED = 4,
}

export namespace GoalStatusEnum {
    export const getOptions = (t: (key: string) => string): { value: number; label: string }[] => {
        return Object.entries(GoalStatusEnum)
            .filter(([_, value]) => typeof value === 'number')
            .map(([key, value]) => ({
                value: value as number,
                label: t(`goalStatuses.${key.toLowerCase()}`)
            }));
    };
}