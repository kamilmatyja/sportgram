const toCamelCase = (str: string) => str.toLowerCase().replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

export function getEnumOptions(
    enumObj: Record<string, unknown>,
    prefix: string,
    t: (key: string) => string,
    excludeKeys: string[] = [],
): { value: number; label: string }[] {
    return Object.entries(enumObj)
        .filter(([key, value]) => typeof value === 'number' && !excludeKeys.includes(key))
        .map(([key, value]) => ({
            value: value as number,
            label: t(`${prefix}.${toCamelCase(key)}`),
        }));
}

export function getEnumLabel(
    enumObj: Record<string, unknown>,
    prefix: string,
    value: number | string | null | undefined,
    t: (key: string) => string,
): string {
    if (value === null || value === undefined) return '';
    const numericValue = Number(value);
    const options = getEnumOptions(enumObj, prefix, t);
    const found = options.find((o) => o.value === numericValue);
    return found ? found.label : String(value);
}
