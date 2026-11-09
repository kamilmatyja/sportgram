import { getEnumOptions } from '../utils';

export enum ConversationStatusEnum {
    SENT = 1,
    READ = 2,
}

export namespace ConversationStatusEnum {
    export const getOptions = (t: (key: string) => string) =>
        getEnumOptions(ConversationStatusEnum, 'conversationStatuses', t);
}
