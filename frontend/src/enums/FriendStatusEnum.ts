import { getEnumOptions } from '../utils/enumUtils';

export enum FriendStatusEnum {
    PENDING = 1,
    ACCEPTED = 2,
    REJECTED = 3,
    BLOCKED = 4,
}

export namespace FriendStatusEnum {
    export const getOptions = (t: (key: string) => string) => getEnumOptions(FriendStatusEnum, 'friends', t);
}
