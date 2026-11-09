export interface SortOption {
    value: string;
    label: string;
}

const DESC_FIRST_FIELDS = new Set(['createdAt', 'updatedAt', 'startedAt', 'endedAt', 'count']);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function buildSortOptions(
    t: (key: string) => string,
    fields: (string | { field: string; labelKey?: string })[] = ['createdAt', 'status'],
): SortOption[] {
    return fields.flatMap((item) => {
        const field = typeof item === 'string' ? item : item.field;
        const key = typeof item === 'string' ? item : (item.labelKey ?? item.field);
        const directions = DESC_FIRST_FIELDS.has(field) ? ['desc', 'asc'] : ['asc', 'desc'];
        return directions.map((dir) => ({
            value: `${field}:${dir}`,
            label: t(`sort${capitalize(key)}${capitalize(dir)}`),
        }));
    });
}

export function getDefaultSortOptions(t: (key: string) => string): SortOption[] {
    return buildSortOptions(t, ['createdAt', 'status']);
}
