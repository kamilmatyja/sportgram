import { getEnumOptions } from '../utils';

export enum RoleEnum {
    PARTICIPANT = 1,
    ORGANIZER = 2,
    ADMINISTRATOR = 3,
}

export namespace RoleEnum {
    export const getOptions = (t: (key: string) => string) => getEnumOptions(RoleEnum, 'roleTypes', t);
    export const getNanoOptions = (t: (key: string) => string) =>
        getEnumOptions(RoleEnum, 'roleTypes', t, ['ADMINISTRATOR']);
}
