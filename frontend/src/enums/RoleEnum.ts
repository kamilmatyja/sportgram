export enum RoleEnum {
    PARTICIPANT = 1,
    ORGANIZER = 2,
    ADMINISTRATOR = 3,
}

export namespace RoleEnum {
    export const getNanoOptions = (t: (key: string) => string): { value: number; label: string }[] => {
        return [
            {value: RoleEnum.PARTICIPANT, label: t('roles.participant')},
            {value: RoleEnum.ORGANIZER, label: t('roles.organizer')},
        ];
    };
}