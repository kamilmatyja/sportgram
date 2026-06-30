import React from 'react';
import { Stack, Form } from 'react-bootstrap';

import { PageFilterQuery } from '../../api/queries/PageFilterQuery';
import { useTranslation } from '../../context/TranslationContext';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { PaginationEnum } from '../../enums/PaginationEnum';
import SelectOptions, { type SelectOption } from '../Common/SelectOptions';

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
    const statusOptions = ElementStatusEnum.getOptions(t) as SelectOption[];
    const limitOptions = PaginationEnum.getOptions(t) as SelectOption[];
    const sortOptions: SelectOption[] = [
        { value: 'createdAt:desc', label: t('sortCreatedDesc') },
        { value: 'createdAt:asc', label: t('sortCreatedAsc') },
        { value: 'title:asc', label: `${t('title')} A-Z` },
        { value: 'title:desc', label: `${t('title')} Z-A` },
    ];

    return (
        <Stack direction="horizontal" gap={2} className="mb-4 flex-wrap align-items-center">
            <Form.Control
                name="title"
                placeholder={t('title')}
                value={filters.title || ''}
                onChange={onFilterChange}
                className="w-auto"
            />
            <Form.Control
                name="link"
                placeholder={t('link')}
                value={filters.link || ''}
                onChange={onFilterChange}
                className="w-auto"
            />
            <Form.Select name="status" value={filters.status || ''} onChange={onFilterChange} className="w-auto">
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
