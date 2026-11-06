import { getEnumOptions } from '../utils/enumUtils';

export enum EntryTypeEnum {
    USER = 1,
    STORY = 2,
    CONVERSATION = 3,
    FEED = 4,
    GOAL = 5,
    PAGE = 6,
    EVENT = 7,
    TRAINING = 8,
}

export namespace EntryTypeEnum {
    export const getOptions = (t: (key: string) => string) => getEnumOptions(EntryTypeEnum, 'entryTypes', t);
}
