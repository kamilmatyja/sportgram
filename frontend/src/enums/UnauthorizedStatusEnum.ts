export enum UnauthorizedStatusEnum {
    NOT_SENT = 1,
    SENT = 2,
    CORRECT = 3,
    INCORRECT = 4,
}

export namespace UnauthorizedStatusEnum {
    export const getOptions = (t: (key: string) => string): { value: number; label: string }[] => {
        return Object.entries(UnauthorizedStatusEnum)
            .filter(([_, value]) => typeof value === 'number')
            .map(([key, value]) => ({
                value: value as number,
                label: t(`unauthorizedStatuses.${key.toLowerCase()}`),
            }));
    };
}
