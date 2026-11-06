import { getEnumOptions, getEnumLabel } from '../utils/enumUtils';

export enum LanguageEnum {
    ENGLISH = 1,
    POLISH = 2,
}

export namespace LanguageEnum {
    export const getOptions = (t: (key: string) => string) => getEnumOptions(LanguageEnum, 'languages', t);
    export const getLabel = (value: number, t: (key: string) => string) =>
        getEnumLabel(LanguageEnum, 'languages', value, t);
}
