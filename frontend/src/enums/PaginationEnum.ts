export enum PaginationEnum {
    XS = 10,
    SM = 20,
    MD = 50,
    LG = 100,
}

export namespace PaginationEnum {
    export const getOptions = (t: (key: string) => string): { value: number; label: string }[] => {
        return Object.entries(PaginationEnum)
            .filter(([_, value]) => typeof value === 'number')
            .map(([, value]) => ({
                value: value as number,
                label: value + ' / ' + t('perPage'),
            }));
    };
}
