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
    export const getOptions = (t: (key: string) => string): { value: number; label: string }[] => {
        return Object.entries(DisciplineEnum)
            .filter(([_, value]) => typeof value === 'number')
            .map(([key, value]) => ({
                value: value as number,
                label: t(`disciplines.${key.toLowerCase()}`),
            }));
    };
}
