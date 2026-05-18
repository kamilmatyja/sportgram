export enum RoleEnum {
    PARTICIPANT = 1,
    ORGANIZER = 2,
    ADMINISTRATOR = 3,
}

export namespace RoleEnum {
    export const getOptions = (t: (key: string) => string): { value: number; label: string }[] => {
        return Object.entries(RoleEnum)
            .filter(([_, value]) => typeof value === 'number')
            .map(([key, value]) => ({
                value: value as number,
                label: t(`roles.${key.toLowerCase()}`)
            }));
    };

    export const getNanoOptions = (
        t: (key: string) => string
    ): { value: number; label: string }[] => {
        return Object.entries(RoleEnum)
            .filter(([key, value]) =>
                typeof value === 'number' && key !== 'ADMINISTRATOR'
            )
            .map(([key, value]) => ({
                value: value as number,
                label: t(`roles.${key.toLowerCase()}`)
            }));
    };
}