import { getEnumOptions } from '../utils/enumUtils';

export enum DisciplineEnum {
    RUNNING = 1,
    CYCLING = 2,
    INLINE_SKATING = 3,
    ICE_SKATING = 4,
    SWIMMING = 5,
    ROWING = 6,
    CANOEING = 7,
    CROSS_COUNTRY_SKIING = 8,
    SNOWBOARDING = 9,
    SKATEBOARDING = 10,
}

export namespace DisciplineEnum {
    export const getOptions = (t: (key: string) => string) => getEnumOptions(DisciplineEnum, 'disciplines', t);
    export const getStringOptions = (t: (key: string) => string) =>
        getOptions(t).map((opt) => ({ value: String(opt.value), label: opt.label }));
}
