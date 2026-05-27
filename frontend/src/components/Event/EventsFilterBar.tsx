import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { EventFilterQuery } from '../../api/queries/EventFilterQuery';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { PaginationEnum } from '../../enums/PaginationEnum';

interface EventsFilterBarProps {
    filters: EventFilterQuery;
    sort: string;
    limit: number;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const EventsFilterBar: React.FC<EventsFilterBarProps> = ({
                                                                    filters, sort, limit, onFilterChange, onSortChange, onLimitChange
                                                                }) => {
    const { t } = useTranslation();

    return (
        <div className="mb-3 d-flex flex-wrap gap-3 align-items-center">
            <input
                name="title"
                placeholder={t('title')}
                value={filters.title || ''}
                onChange={onFilterChange}
                className="form-control w-auto"
            />
            <input
                name="link"
                placeholder={t('link')}
                value={filters.link || ''}
                onChange={onFilterChange}
                className="form-control w-auto"
            />
            <select name="status" value={filters.status || ''} onChange={onFilterChange} className="form-select w-auto">
                <option value="">{t('status')}</option>
                {ElementStatusEnum.getOptions(t).map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <select value={sort} onChange={onSortChange} className="form-select w-auto ms-auto">
                <option value="createdAt:desc">{t('sortCreatedDesc')}</option>
                <option value="createdAt:asc">{t('sortCreatedAsc')}</option>
                <option value="startedAt:desc">{t('startedAt')} Z-A</option>
                <option value="startedAt:asc">{t('startedAt')} A-Z</option>
            </select>
            <select value={limit} onChange={onLimitChange} className="form-select w-auto">
                {PaginationEnum.getOptions(t).map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
};