import { getEnumOptions, getEnumLabel } from '../utils/enumUtils';

export enum GenderEnum {
    MALE = 1,
    FEMALE = 2,
}

export namespace GenderEnum {
    export const getOptions = (t: (key: string) => string) => getEnumOptions(GenderEnum, 'genders', t);
    export const getLabel = (value: number, t: (key: string) => string) =>
        getEnumLabel(GenderEnum, 'genders', value, t);
}
