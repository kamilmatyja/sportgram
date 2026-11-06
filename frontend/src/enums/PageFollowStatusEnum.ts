import { getEnumOptions } from '../utils/enumUtils';

export enum PageFollowStatusEnum {
    PENDING = 1,
    ACCEPTED = 2,
    REJECTED = 3,
    UNFOLLOWED = 4,
}

export namespace PageFollowStatusEnum {
    export const getOptions = (t: (key: string) => string) =>
        getEnumOptions(PageFollowStatusEnum, 'pageFollowStatuses', t);
}
