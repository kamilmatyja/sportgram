export enum ColorEnum {
    RED = 1,
    GREEN = 2,
    BLUE = 3,
    YELLOW = 4,
    GRAY = 5,
    ORANGE = 6,
    BROWN = 7,
    PURPLE = 8,
    PINK = 9,
}

export namespace ColorEnum {
    export const getOptions = (t: (key: string) => string): { value: number; label: string }[] => {
        return Object.entries(ColorEnum)
            .filter(([_, value]) => typeof value === 'number')
            .map(([key, value]) => ({
                value: value as number,
                label: t(`colors.${key.toLowerCase()}`)
            }));
    };
}

