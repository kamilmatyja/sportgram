import React from 'react';
import { Stack, Form } from 'react-bootstrap';

import { UserFilterQuery } from '../../api/queries/UserFilterQuery';
import { useTranslation } from '../../context/TranslationContext';
import { CountryEnum } from '../../enums/CountryEnum';
import { GenderEnum } from '../../enums/GenderEnum';
import { PaginationEnum } from '../../enums/PaginationEnum';
import { UserStatusEnum } from '../../enums/UserStatusEnum';
import SelectOptions, { type SelectOption } from '../Common/SelectOptions';

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
    const sortOptions: SelectOption[] = [
        { value: 'createdAt:desc', label: `${t('createdAt')} Z-A` },
        { value: 'createdAt:asc', label: `${t('createdAt')} A-Z` },
        { value: 'firstName:desc', label: `${t('firstName')} Z-A` },
        { value: 'firstName:asc', label: `${t('firstName')} A-Z` },
        { value: 'lastName:desc', label: `${t('lastName')} Z-A` },
        { value: 'lastName:asc', label: `${t('lastName')} A-Z` },
        { value: 'gender:desc', label: `${t('gender')} Z-A` },
        { value: 'gender:asc', label: `${t('gender')} A-Z` },
        { value: 'country:desc', label: `${t('country')} Z-A` },
        { value: 'country:asc', label: `${t('country')} A-Z` },
        { value: 'birthAt:desc', label: `${t('birthAt')} 9-0` },
        { value: 'birthAt:asc', label: `${t('birthAt')} 0-9` },
        { value: 'status:desc', label: `${t('status')} Z-A` },
        { value: 'status:asc', label: `${t('status')} A-Z` },
    ];

    return (
        <Stack direction="horizontal" gap={2} className="mb-4 flex-wrap align-items-center">
            <Form.Control
                name="firstName"
                placeholder={t('firstName')}
                value={filters.firstName || ''}
                onChange={onFilterChange}
                className="w-auto"
            />
            <Form.Control
                name="lastName"
                placeholder={t('lastName')}
                value={filters.lastName || ''}
                onChange={onFilterChange}
                className="w-auto"
            />
            <Form.Control
                name="email"
                placeholder={t('email')}
                value={filters.email || ''}
                onChange={onFilterChange}
                className="w-auto"
            />
            <Form.Select name="gender" value={filters.gender || ''} onChange={onFilterChange} className="w-auto">
                <SelectOptions options={GenderEnum.getOptions(t) as any} placeholder={t('gender')} />
            </Form.Select>
            <Form.Select name="country" value={filters.country || ''} onChange={onFilterChange} className="w-auto">
                <SelectOptions options={CountryEnum.getOptions(t) as any} placeholder={t('country')} />
            </Form.Select>
            <Form.Select name="status" value={filters.status || ''} onChange={onFilterChange} className="w-auto">
                <SelectOptions options={UserStatusEnum.getOptions(t) as any} placeholder={t('status')} />
            </Form.Select>
            <Form.Select value={sort} onChange={onSortChange} className="ms-auto w-auto">
                <SelectOptions options={sortOptions} />
            </Form.Select>
            <Form.Select value={limit} onChange={onLimitChange} className="w-auto">
                <SelectOptions options={PaginationEnum.getOptions(t) as any} />
            </Form.Select>
        </Stack>
    );
};
