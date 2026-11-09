import { getEnumOptions } from '../utils';

export enum ElementStatusEnum {
    DRAFT = 1,
    ACTIVE = 2,
    REJECTED = 3,
}

export namespace ElementStatusEnum {
    export const getOptions = (t: (key: string) => string) => getEnumOptions(ElementStatusEnum, 'elementStatuses', t);
}
