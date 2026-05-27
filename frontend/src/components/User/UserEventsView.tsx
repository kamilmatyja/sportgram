import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { EventResponse } from '../../api/responses/EventResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { EventFilterQuery } from '../../api/queries/EventFilterQuery';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { PaginationEnum } from '../../enums/PaginationEnum';
import { ColorEnum } from '../../enums/ColorEnum';
import { UserSubpageHeader } from './UserSubpageHeader';
import { Pagination } from '../Common/Pagination';
import { UserEventsTable } from '../Event/UserEventsTable';

interface UserEventsViewProps {
    user: UserResponse | null;
    events: EventResponse[];
    isMyProfile: boolean;
    isAdmin: boolean;
    isOrganizer: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    limit: number;
    sort: string;
    filters: EventFilterQuery;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
    onManageClick: (eventObj: EventResponse) => void;
    interactions: any;
}

export const UserEventsView: React.FC<UserEventsViewProps> = ({
                                                                  user, events, isMyProfile, isAdmin, isOrganizer, loading, error, page, limit, sort, filters,
                                                                  onFilterChange, onSortChange, onLimitChange, onPrevPage, onNextPage, onAddClick, onManageClick, interactions
                                                              }) => {
    const { t } = useTranslation();

    if (loading && events.length === 0) return <div className="container mt-5 text-center"><div className="spinner-border text-profile-primary" /></div>;
    if (error || !user) return <div className="container mt-5 alert alert-danger">{error ? t(error) : t('userNotFound')}</div>;

    const themeClass = ColorEnum.getClass(user.color);

    return (
        <div className={`container mt-4 mb-5 ${themeClass}`}>
            <UserSubpageHeader user={user} />

            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0 text-profile-primary fw-bold">{t('events')}</h4>
                        {(isMyProfile && isOrganizer) && (
                            <button className="btn btn-profile-primary" onClick={onAddClick}>
                                {t('addEvent')}
                            </button>
                        )}
                    </div>

                    <div className="mb-3 d-flex flex-wrap gap-3 align-items-center">
                        <input name="title" placeholder={t('title')} value={filters.title || ''} onChange={onFilterChange} className="form-control w-auto" />
                        <input name="link" placeholder={t('link')} value={filters.link || ''} onChange={onFilterChange} className="form-control w-auto" />
                        <select name="status" value={filters.status || ''} onChange={onFilterChange} className="form-select w-auto">
                            <option value="">{t('status')}</option>
                            {ElementStatusEnum.getOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <select value={sort} onChange={onSortChange} className="form-select w-auto ms-auto">
                            <option value="createdAt:desc">{t('sortCreatedDesc')}</option>
                            <option value="createdAt:asc">{t('sortCreatedAsc')}</option>
                            <option value="startedAt:desc">{t('startedAt')} Z-A</option>
                            <option value="startedAt:asc">{t('startedAt')} A-Z</option>
                        </select>
                        <select value={limit} onChange={onLimitChange} className="form-select w-auto">
                            {PaginationEnum.getOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>

                    {loading ? (
                        <div className="text-center my-4"><div className="spinner-border text-profile-primary" /></div>
                    ) : (
                        <>
                            <UserEventsTable
                                events={events}
                                isMyProfile={isMyProfile}
                                isAdmin={isAdmin}
                                actionLoading={interactions.actionLoading}
                                onManageClick={onManageClick}
                                interactions={interactions}
                            />
                            <div className="mt-3">
                                <Pagination page={page} hasMore={events.length >= limit} onPrevPage={onPrevPage} onNextPage={onNextPage} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};