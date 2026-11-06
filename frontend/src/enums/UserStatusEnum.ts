import { getEnumOptions } from '../utils/enumUtils';

export enum UserStatusEnum {
    PENDING = 1,
    ACCEPTED = 2,
    BANNED = 3,
}

export namespace UserStatusEnum {
    export const getOptions = (t: (key: string) => string) => getEnumOptions(UserStatusEnum, 'userStatuses', t);
    export const getNanoOptions = (t: (key: string) => string) =>
        getEnumOptions(UserStatusEnum, 'userStatuses', t, ['PENDING']);
}
