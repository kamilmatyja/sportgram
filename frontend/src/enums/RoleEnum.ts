import { getEnumOptions } from '../utils/enumUtils';

export enum RoleEnum {
    PARTICIPANT = 1,
    ORGANIZER = 2,
    ADMINISTRATOR = 3,
}

export namespace RoleEnum {
    export const getOptions = (t: (key: string) => string) => getEnumOptions(RoleEnum, 'roles', t);
    export const getNanoOptions = (t: (key: string) => string) =>
        getEnumOptions(RoleEnum, 'roles', t, ['ADMINISTRATOR']);
}
