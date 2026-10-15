import React from 'react';

import { EventFilterQuery } from '../../api/queries/EventFilterQuery';
import { useTranslation } from '../../context/TranslationContext';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { buildSortOptions } from '../../utils/options';
import { FilterBar, FilterInput, FilterSelect, SortLimitSelect } from '../Common/FilterBar';
import { type SelectOption } from '../Common/SelectOptions';

interface EventsFilterBarProps {
    filters: EventFilterQuery;
    sort: string;
    limit: number;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const EventsFilterBar: React.FC<EventsFilterBarProps> = ({
    filters,
    sort,
    limit,
    onFilterChange,
    onSortChange,
    onLimitChange,
}) => {
    const { t } = useTranslation();
    const statusOptions = ElementStatusEnum.getOptions(t) as SelectOption[];
    const sortOptions = buildSortOptions(t, ['createdAt', 'startedAt', 'endedAt', 'title', 'location', 'status']);

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
