import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { UserFilterQuery } from '../../api/queries/UserFilterQuery';
import { GenderEnum } from '../../enums/GenderEnum';
import { CountryEnum } from '../../enums/CountryEnum';
import { UserStatusEnum } from '../../enums/UserStatusEnum';
import { PaginationEnum } from '../../enums/PaginationEnum';

interface UsersFilterBarProps {
    filters: UserFilterQuery;
    sort: string;
    limit: number;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const UsersFilterBar: React.FC<UsersFilterBarProps> = ({
                                                                  filters, sort, limit, onFilterChange, onSortChange, onLimitChange
                                                              }) => {
    const { t } = useTranslation();

    return (
        <div className="mb-3 d-flex flex-wrap gap-3 align-items-center">
            <input name="firstName" placeholder={t('firstName')} value={filters.firstName || ''} onChange={onFilterChange} className="form-control w-auto" />
            <input name="lastName" placeholder={t('lastName')} value={filters.lastName || ''} onChange={onFilterChange} className="form-control w-auto" />
            <input name="email" placeholder={t('email')} value={filters.email || ''} onChange={onFilterChange} className="form-control w-auto" />
            <input name="link" placeholder={t('link')} value={filters.link || ''} onChange={onFilterChange} className="form-control w-auto" />

            <select name="gender" value={filters.gender || ''} onChange={onFilterChange} className="form-select w-auto">
                <option value="">{t('gender')}</option>
                {GenderEnum.getOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>

            <select name="country" value={filters.country || ''} onChange={onFilterChange} className="form-select w-auto">
                <option value="">{t('country')}</option>
                {CountryEnum.getOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>

            <select name="status" value={filters.status || ''} onChange={onFilterChange} className="form-select w-auto">
                <option value="">{t('status')}</option>
                {UserStatusEnum.getOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>

            <select value={sort} onChange={onSortChange} className="form-select w-auto ms-auto">
                <option value="createdAt:desc">{t('sortCreatedDesc')}</option>
                <option value="createdAt:asc">{t('sortCreatedAsc')}</option>
                <option value="firstName:asc">{t('sortFirstNameAsc')}</option>
                <option value="firstName:desc">{t('sortFirstNameDesc')}</option>
                <option value="lastName:asc">{t('sortLastNameAsc')}</option>
                <option value="lastName:desc">{t('sortLastNameDesc')}</option>
            </select>

            <select value={limit} onChange={onLimitChange} className="form-select w-auto">
                {PaginationEnum.getOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );
};