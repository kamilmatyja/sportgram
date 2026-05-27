export enum LanguageEnum {
    ENGLISH = 1,
    POLISH = 2,
}

export namespace LanguageEnum {
    export const getOptions = (t: (key: string) => string): { value: number; label: string }[] => {
        return Object.entries(LanguageEnum)
            .filter(([_, value]) => typeof value === 'number')
            .map(([key, value]) => ({
                value: value as number,
                label: t(`languages.${key.toLowerCase()}`)
            }));
    };
}

