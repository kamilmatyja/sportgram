import { getEnumOptions, getEnumLabel } from '../utils';

export enum ThemeEnum {
    DARK = 1,
    LIGHT = 2,
}

export namespace ThemeEnum {
    export const getOptions = (t: (key: string) => string) => getEnumOptions(ThemeEnum, 'themes', t);
    export const getLabel = (value: number, t: (key: string) => string) => getEnumLabel(ThemeEnum, 'themes', value, t);
}
