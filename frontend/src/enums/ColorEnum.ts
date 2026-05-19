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

    export const getHex = (color: number): string => {
        switch (color) {
            case ColorEnum.RED:
                return '#dc3545';
            case ColorEnum.GREEN:
                return '#198754';
            case ColorEnum.BLUE:
                return '#0d6efd';
            case ColorEnum.YELLOW:
                return '#ffc107';
            case ColorEnum.GRAY:
                return '#6c757d';
            case ColorEnum.ORANGE:
                return '#fd7e14';
            case ColorEnum.BROWN:
                return '#795548';
            case ColorEnum.PURPLE:
                return '#6f42c1';
            default:
                return '#e83e8c';
        }
    };
}
