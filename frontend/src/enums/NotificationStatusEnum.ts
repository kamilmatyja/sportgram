import { getEnumOptions } from '../utils/enumUtils';

export enum NotificationStatusEnum {
    NOT_SENT = 1,
    SENT = 2,
    READ = 3,
}

export namespace NotificationStatusEnum {
    export const getOptions = (t: (key: string) => string) =>
        getEnumOptions(NotificationStatusEnum, 'notificationStatuses', t);
}
