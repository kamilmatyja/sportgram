import { getEnumOptions, getEnumLabel } from '../utils/enumUtils';

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
    export const getOptions = (t: (key: string) => string) => getEnumOptions(ColorEnum, 'colors', t);
    export const getLabel = (value: number, t: (key: string) => string) => getEnumLabel(ColorEnum, 'colors', value, t);

    export const getMantineColor = (color?: number | string | null): string => {
        const num = color !== undefined && color !== null ? Number(color) : null;
        switch (num) {
            case ColorEnum.RED:
                return 'red';
            case ColorEnum.GREEN:
                return 'green';
            case ColorEnum.BLUE:
                return 'blue';
            case ColorEnum.YELLOW:
                return 'yellow';
            case ColorEnum.GRAY:
                return 'gray';
            case ColorEnum.ORANGE:
                return 'orange';
            case ColorEnum.BROWN:
                return 'brown';
            case ColorEnum.PURPLE:
                return 'grape';
            case ColorEnum.PINK:
                return 'pink';
            default:
                return 'blue';
        }
    };
}
