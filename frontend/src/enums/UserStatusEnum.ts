export enum UserStatusEnum {
    PENDING = 1,
    ACCEPTED = 2,
    BANNED = 3,
}

export namespace UserStatusEnum {
    export const getOptions = (t: (key: string) => string): { value: number; label: string }[] => {
        return Object.entries(UserStatusEnum)
            .filter(([_, value]) => typeof value === 'number')
            .map(([key, value]) => ({
                value: value as number,
                label: t(`userStatuses.${key.toLowerCase()}`)
            }));
    };

    export const getNanoOptions = (
        t: (key: string) => string
    ): { value: number; label: string }[] => {
        return Object.entries(UserStatusEnum)
            .filter(([key, value]) =>
                typeof value === 'number' && key !== 'PENDING'
            )
            .map(([key, value]) => ({
                value: value as number,
                label: t(`userStatuses.${key.toLowerCase()}`)
            }));
    };
}