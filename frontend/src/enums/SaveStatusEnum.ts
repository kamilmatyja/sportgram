import { getEnumOptions } from '../utils';

export enum SaveStatusEnum {
    PENDING = 1,
    ACCEPTED = 2,
    REJECTED = 3,
}

export namespace SaveStatusEnum {
    export const getOptions = (t: (key: string) => string) => getEnumOptions(SaveStatusEnum, 'saveStatuses', t);
}
