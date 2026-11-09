import { getEnumOptions } from '../utils';

export enum PushSubscriptionStatusEnum {
    ACTIVE = 1,
    REJECTED = 2,
}

export namespace PushSubscriptionStatusEnum {
    export const getOptions = (t: (key: string) => string) =>
        getEnumOptions(PushSubscriptionStatusEnum, 'pushSubscriptionStatuses', t);
}
