export enum ElementStatusEnum {
    DRAFT = 1,
    ACTIVE = 2,
    REJECTED = 3,
}

export namespace ElementStatusEnum {
    export const getOptions = (t: (key: string) => string): { value: number; label: string }[] => {
        return Object.entries(ElementStatusEnum)
            .filter(([_, value]) => typeof value === 'number')
            .map(([key, value]) => ({
                value: value as number,
                label: t(`elementStatuses.${key.toLowerCase()}`),
            }));
    };
}
