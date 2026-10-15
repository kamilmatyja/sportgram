import { type SelectOption } from '../components/Common/SelectOptions';

export const getOptionLabel = (options: SelectOption[], value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '';

    return options.find((option) => String(option.value) === String(value))?.label ?? String(value);
};

type SortField = string | { field: string; label?: string; numeric?: boolean };

export const buildSortOptions = (t: (key: string) => string, fields: SortField[]): SelectOption[] =>
    fields.flatMap((sortField) => {
        const {
            field,
            label = field,
            numeric = false,
        } = typeof sortField === 'string' ? { field: sortField } : sortField;
        const [desc, asc] = numeric ? ['9-0', '0-9'] : ['Z-A', 'A-Z'];

        return [
            { value: `${field}:desc`, label: `${t(label)} ${desc}` },
            { value: `${field}:asc`, label: `${t(label)} ${asc}` },
        ];
    });
