import React from 'react';

import { PageFilterQuery } from '../../api/queries/PageFilterQuery';
import { useTranslation } from '../../context/TranslationContext';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { buildSortOptions } from '../../utils/options';
import { FilterBar, FilterInput, FilterSelect, SortLimitSelect } from '../Common/FilterBar';

interface PagesFilterBarProps {
    filters: PageFilterQuery;
    sort: string;
    limit: number;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const PagesFilterBar: React.FC<PagesFilterBarProps> = ({
    filters,
    sort,
    limit,
    onFilterChange,
    onSortChange,
    onLimitChange,
}) => {
    const { t } = useTranslation();
    const statusOptions = ElementStatusEnum.getOptions(t);
    const sortOptions = buildSortOptions(t, ['createdAt', 'title', 'status']);

    return (
        <FilterBar>
            <FilterInput name="title" placeholder={t('title')} value={filters.title || ''} onChange={onFilterChange} />
            <FilterInput name="link" placeholder={t('link')} value={filters.link || ''} onChange={onFilterChange} />
            <FilterSelect
                name="status"
                value={filters.status || ''}
                onChange={onFilterChange}
                options={statusOptions}
                placeholder={t('status')}
            />
            <SortLimitSelect
                sortOptions={sortOptions}
                sort={sort}
                limit={limit}
                onSortChange={onSortChange}
                onLimitChange={onLimitChange}
            />
        </FilterBar>
    );
};
