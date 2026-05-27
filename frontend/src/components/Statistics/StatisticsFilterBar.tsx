import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { StatisticFilterQuery } from '../../api/queries/StatisticFilterQuery';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { PaginationEnum } from '../../enums/PaginationEnum';
import { UserResponse } from '../../api/responses/UserResponse';

interface StatisticsFilterBarProps {
    filters: StatisticFilterQuery;
    sort: string;
    limit: number;
    activeTab: 'records' | 'progress';
    availableUsers: UserResponse[];
    currentUser: UserResponse | null;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onUsersChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const StatisticsFilterBar: React.FC<StatisticsFilterBarProps> = ({
                                                                            filters, sort, limit, activeTab, availableUsers, currentUser,
                                                                            onFilterChange, onUsersChange, onSortChange, onLimitChange
                                                                        }) => {
    const { t } = useTranslation();

    return (
        <div className="row mb-4">
            <div className="col-12 col-lg-3 mb-3 mb-lg-0">
                <label className="form-label fw-bold">{t('selectFriends')}</label>
                <select
                    multiple
                    className="form-select"
                    value={filters.userIds || []}
                    onChange={onUsersChange}
                >
                    {availableUsers.map(u => (
                        <option key={u.id} value={u.id}>
                            {u.firstName} {u.lastName} {currentUser && u.id === currentUser.id ? `(${t('profile')})` : ''}
                        </option>
                    ))}
                </select>
            </div>

            <div className="col-12 col-lg-9 d-flex flex-wrap gap-3 align-items-end">
                <div>
                    <label className="form-label small text-muted mb-1">{t('discipline')}</label>
                    <select name="discipline" value={filters.discipline || ''} onChange={onFilterChange} className="form-select w-auto">
                        <option value="">{t('selectOption')}</option>
                        {DisciplineEnum.getOptions(t).map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="form-label small text-muted mb-1">{t('distance')}</label>
                    <input type="number" name="distance" placeholder={t('distanceMeters')} value={filters.distance || ''} onChange={onFilterChange} className="form-control w-auto"/>
                </div>

                <div className="ms-auto d-flex gap-3">
                    <div>
                        <label className="form-label small text-muted mb-1">{t('sortCreatedDesc').split(' ')[0]}</label>
                        <select value={sort} onChange={onSortChange} className="form-select w-auto">
                            {activeTab === 'progress' ? (
                                <>
                                    <option value="createdAt:desc">{t('sortCreatedDesc')}</option>
                                    <option value="createdAt:asc">{t('sortCreatedAsc')}</option>
                                    <option value="time:desc">{t('timeSeconds')} 9-0</option>
                                    <option value="time:asc">{t('timeSeconds')} 0-9</option>
                                </>
                            ) : (
                                <>
                                    <option value="time:asc">{t('timeSeconds')} 0-9</option>
                                    <option value="time:desc">{t('timeSeconds')} 9-0</option>
                                    <option value="distance:desc">{t('distance')} 9-0</option>
                                    <option value="distance:asc">{t('distance')} 0-9</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="form-label small text-muted mb-1">{t('page')}</label>
                        <select value={limit} onChange={onLimitChange} className="form-select w-auto">
                            {PaginationEnum.getOptions(t).map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};