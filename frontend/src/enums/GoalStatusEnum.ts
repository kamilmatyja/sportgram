import { getEnumOptions } from '../utils';

export enum GoalStatusEnum {
    DRAFT = 1,
    ACTIVE = 2,
    COMPLETED = 3,
    REJECTED = 4,
}

export namespace GoalStatusEnum {
    export const getOptions = (t: (key: string) => string) => getEnumOptions(GoalStatusEnum, 'goalStatuses', t);
}
