export enum FriendStatusEnum {
    PENDING = 1,
    ACCEPTED = 2,
    REJECTED = 3,
    BLOCKED = 4,
}

export namespace FriendStatusEnum {
    export const getOptions = (t: (key: string) => string): { value: number; label: string }[] => {
        return Object.entries(FriendStatusEnum)
            .filter(([_, value]) => typeof value === 'number')
            .map(([key, value]) => ({
                value: value as number,
                label: t(`friends.${key.toLowerCase()}`)
            }));
    };

    export const getNanoOptions = (
        t: (key: string) => string
    ): { value: number; label: string }[] => {
        return Object.entries(FriendStatusEnum)
            .filter(([key, value]) =>
                typeof value === 'number' && key !== 'PENDING'
            )
            .map(([key, value]) => ({
                value: value as number,
                label: t(`friends.${key.toLowerCase()}`)
            }));
    };
}