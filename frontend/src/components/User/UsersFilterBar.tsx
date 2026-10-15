import React from 'react';

import { UserFilterQuery } from '../../api/queries/UserFilterQuery';
import { useTranslation } from '../../context/TranslationContext';
import { CountryEnum } from '../../enums/CountryEnum';
import { GenderEnum } from '../../enums/GenderEnum';
import { UserStatusEnum } from '../../enums/UserStatusEnum';
import { buildSortOptions } from '../../utils/options';
import { FilterBar, FilterInput, FilterSelect, SortLimitSelect } from '../Common/FilterBar';

interface UsersFilterBarProps {
    filters: UserFilterQuery;
    sort: string;
    limit: number;
    onFilterChange: (e: React.ChangeEvent<any>) => void;
    onSortChange: (e: React.ChangeEvent<any>) => void;
    onLimitChange: (e: React.ChangeEvent<any>) => void;
}

export const UsersFilterBar: React.FC<UsersFilterBarProps> = ({
    filters,
    sort,
    limit,
    onFilterChange,
    onSortChange,
    onLimitChange,
}) => {
    const { t } = useTranslation();
    const sortOptions = buildSortOptions(t, [
        'createdAt',
        'firstName',
        'lastName',
        'gender',
        'country',
        { field: 'birthAt', numeric: true },
        'status',
    ]);

    return (
        <FilterBar>
            <FilterInput
                name="firstName"
                placeholder={t('firstName')}
                value={filters.firstName || ''}
                onChange={onFilterChange}
            />
            <FilterInput
                name="lastName"
                placeholder={t('lastName')}
                value={filters.lastName || ''}
                onChange={onFilterChange}
            />
            <FilterInput name="email" placeholder={t('email')} value={filters.email || ''} onChange={onFilterChange} />
            <FilterSelect
                name="gender"
                value={filters.gender || ''}
                onChange={onFilterChange}
                options={GenderEnum.getOptions(t)}
                placeholder={t('gender')}
            />
            <FilterSelect
                name="country"
                value={filters.country || ''}
                onChange={onFilterChange}
                options={CountryEnum.getOptions(t)}
                placeholder={t('country')}
            />
            <FilterSelect
                name="status"
                value={filters.status || ''}
                onChange={onFilterChange}
                options={UserStatusEnum.getOptions(t)}
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
