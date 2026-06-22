import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {EventFilterQuery} from '../../api/queries/EventFilterQuery';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {PaginationEnum} from '../../enums/PaginationEnum';
import SelectOptions, {type SelectOption} from '../Common/SelectOptions';
import {Stack, Form} from 'react-bootstrap';

interface EventsFilterBarProps {
    filters: EventFilterQuery;
    sort: string;
    limit: number;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const EventsFilterBar: React.FC<EventsFilterBarProps> = ({
                                                                    filters,
                                                                    sort,
                                                                    limit,
                                                                    onFilterChange,
                                                                    onSortChange,
                                                                    onLimitChange
                                                                }) => {
    const {t} = useTranslation();
    const statusOptions = ElementStatusEnum.getOptions(t) as SelectOption[];
    const limitOptions = PaginationEnum.getOptions(t) as SelectOption[];
    const sortOptions: SelectOption[] = [
        {value: 'createdAt:desc', label: t('sortCreatedDesc')},
        {value: 'createdAt:asc', label: t('sortCreatedAsc')},
        {value: 'startedAt:desc', label: `${t('startedAt')} Z-A`},
        {value: 'startedAt:asc', label: `${t('startedAt')} A-Z`},
    ];

    return (
        <Stack direction="horizontal" gap={3} className="mb-3 flex-wrap align-items-center">
            <Form.Control
                name="title"
                placeholder={t('title')}
                value={filters.title || ''}
                onChange={e => onFilterChange(e as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>)}
                className="w-auto"
            />
            <Form.Control
                name="link"
                placeholder={t('link')}
                value={filters.link || ''}
                onChange={e => onFilterChange(e as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>)}
                className="w-auto"
            />
            <Form.Select
                name="status"
                value={filters.status || ''}
                onChange={e => onFilterChange(e as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>)}
                className="w-auto"
            >
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