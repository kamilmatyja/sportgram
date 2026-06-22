import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {UserFilterQuery} from '../../api/queries/UserFilterQuery';
import {GenderEnum} from '../../enums/GenderEnum';
import {CountryEnum} from '../../enums/CountryEnum';
import {UserStatusEnum} from '../../enums/UserStatusEnum';
import {PaginationEnum} from '../../enums/PaginationEnum';
import {Stack, Form} from 'react-bootstrap';
import SelectOptions, {type SelectOption} from '../Common/SelectOptions';

interface UsersFilterBarProps {
    filters: UserFilterQuery;
    sort: string;
    limit: number;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const UsersFilterBar: React.FC<UsersFilterBarProps> = ({
                                                                  filters,
                                                                  sort,
                                                                  limit,
                                                                  onFilterChange,
                                                                  onSortChange,
                                                                  onLimitChange
                                                              }) => {
    const {t} = useTranslation();
    const genderOptions = GenderEnum.getOptions(t) as SelectOption[];
    const countryOptions = CountryEnum.getOptions(t) as SelectOption[];
    const statusOptions = UserStatusEnum.getOptions(t) as SelectOption[];
    const limitOptions = PaginationEnum.getOptions(t) as SelectOption[];
    const sortOptions: SelectOption[] = [
        {value: 'createdAt:desc', label: t('sortCreatedDesc')},
        {value: 'createdAt:asc', label: t('sortCreatedAsc')},
        {value: 'firstName:asc', label: t('sortFirstNameAsc')},
        {value: 'firstName:desc', label: t('sortFirstNameDesc')},
        {value: 'lastName:asc', label: t('sortLastNameAsc')},
        {value: 'lastName:desc', label: t('sortLastNameDesc')},
    ];

    return (
        <Stack direction="horizontal" gap={3} className="mb-3 flex-wrap align-items-center">
            <Form.Control name="firstName" placeholder={t('firstName')} value={filters.firstName || ''}
                          onChange={e => onFilterChange(e as any)} className="w-auto"/>
            <Form.Control name="lastName" placeholder={t('lastName')} value={filters.lastName || ''} onChange={e => onFilterChange(e as any)}
                          className="w-auto"/>
            <Form.Control name="email" placeholder={t('email')} value={filters.email || ''} onChange={e => onFilterChange(e as any)}
                          className="w-auto"/>
            <Form.Control name="link" placeholder={t('link')} value={filters.link || ''} onChange={e => onFilterChange(e as any)}
                          className="w-auto"/>

            <Form.Select name="gender" value={filters.gender || ''} onChange={e => onFilterChange(e as any)} className="w-auto">
                <SelectOptions options={genderOptions} placeholder={t('gender')} />
            </Form.Select>

            <Form.Select name="country" value={filters.country || ''} onChange={e => onFilterChange(e as any)}
                         className="w-auto">
                <SelectOptions options={countryOptions} placeholder={t('country')} />
            </Form.Select>

            <Form.Select name="status" value={filters.status || ''} onChange={e => onFilterChange(e as any)} className="w-auto">
                <SelectOptions options={statusOptions} placeholder={t('status')} />
            </Form.Select>

            <Form.Select value={sort} onChange={onSortChange} className="w-auto ms-auto">
                <SelectOptions options={sortOptions} />
            </Form.Select>

            <Form.Select value={limit} onChange={onLimitChange} className="w-auto">
                <SelectOptions options={limitOptions} />
            </Form.Select>
        </Stack>
    );
};