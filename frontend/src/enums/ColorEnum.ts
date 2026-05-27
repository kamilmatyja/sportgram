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

    export const getClass = (color?: number): string => {
        switch (color) {
            case ColorEnum.RED:
                return 'theme-red';
            case ColorEnum.GREEN:
                return 'theme-green';
            case ColorEnum.BLUE:
                return 'theme-blue';
            case ColorEnum.YELLOW:
                return 'theme-yellow';
            case ColorEnum.GRAY:
                return 'theme-gray';
            case ColorEnum.ORANGE:
                return 'theme-orange';
            case ColorEnum.BROWN:
                return 'theme-brown';
            case ColorEnum.PURPLE:
                return 'theme-purple';
            case ColorEnum.PINK:
                return 'theme-pink';
            default:
                return 'theme-blue';
        }
    };
}
