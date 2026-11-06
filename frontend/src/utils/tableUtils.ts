export interface SortOption {
    value: string;
    label: string;
}

export interface DefaultSortOptionsConfig {
    withStatus?: boolean;
    withName?: boolean;
}

export function getDefaultSortOptions(
    t: (key: string) => string,
    config: DefaultSortOptionsConfig = { withStatus: true },
): SortOption[] {
    const options: SortOption[] = [
        { value: 'createdAt:desc', label: t('sort_createdAt_desc') },
        { value: 'createdAt:asc', label: t('sort_createdAt_asc') },
    ];

    if (config.withStatus) {
        options.push(
            { value: 'status:desc', label: t('sort_status_desc') },
            { value: 'status:asc', label: t('sort_status_asc') },
        );
    }

    if (config.withName) {
        options.push(
            { value: 'name:asc', label: t('sort_name_asc') },
            { value: 'name:desc', label: t('sort_name_desc') },
        );
    }

    return options;
}
