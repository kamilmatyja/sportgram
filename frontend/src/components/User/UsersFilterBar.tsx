import React from 'react';
import { Stack, Form } from 'react-bootstrap';

import { UserFilterQuery } from '../../api/queries/UserFilterQuery';
import { useTranslation } from '../../context/TranslationContext';
import { CountryEnum } from '../../enums/CountryEnum';
import { GenderEnum } from '../../enums/GenderEnum';
import { PaginationEnum } from '../../enums/PaginationEnum';
import { UserStatusEnum } from '../../enums/UserStatusEnum';
import SelectOptions from '../Common/SelectOptions';

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
                <SelectOptions
                    options={
                        [
                            { value: 'createdAt:desc', label: t('sortCreatedDesc') },
                            { value: 'createdAt:asc', label: t('sortCreatedAsc') },
                        ] as any
                    }
                />
            </Form.Select>
            <Form.Select value={limit} onChange={onLimitChange} className="w-auto">
                <SelectOptions options={PaginationEnum.getOptions(t) as any} />
            </Form.Select>
        </Stack>
    );
};
