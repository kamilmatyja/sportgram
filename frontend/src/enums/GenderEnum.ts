export enum GenderEnum {
    MALE = 1,
    FEMALE = 2,
}

export namespace GenderEnum {
    export const getOptions = (t: (key: string) => string): { value: number; label: string }[] => {
        return Object.entries(GenderEnum)
            .filter(([_, value]) => typeof value === 'number')
            .map(([key, value]) => ({
                value: value as number,
                label: t(`genders.${key.toLowerCase()}`)
            }));
    };
}