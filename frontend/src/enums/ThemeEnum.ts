export enum ThemeEnum {
    DARK = 1,
    LIGHT = 2,
}

export namespace ThemeEnum {
    export const getOptions = (t: (key: string) => string): { value: number; label: string }[] => {
        return Object.entries(ThemeEnum)
            .filter(([_, value]) => typeof value === 'number')
            .map(([key, value]) => ({
                value: value as number,
                label: t(`themes.${key.toLowerCase()}`),
            }));
    };
}
