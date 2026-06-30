export enum SaveStatusEnum {
    PENDING = 1,
    ACCEPTED = 2,
    REJECTED = 3,
}

export namespace SaveStatusEnum {
    export const getOptions = (t: (key: string) => string): { value: number; label: string }[] => {
        return Object.entries(SaveStatusEnum)
            .filter(([_, value]) => typeof value === 'number')
            .map(([key, value]) => ({
                value: value as number,
                label: t(`saveStatuses.${key.toLowerCase()}`),
            }));
    };
}
