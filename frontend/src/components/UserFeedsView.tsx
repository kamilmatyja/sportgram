import React from 'react';
import { useTranslation } from '../context/TranslationContext';
import { FeedResponse } from '../api/responses/FeedResponse';
import { UserResponse } from '../api/responses/UserResponse';
import { FeedFilterQuery } from '../api/queries/FeedFilterQuery';
import { ElementStatusEnum } from '../enums/ElementStatusEnum';
import { PaginationEnum } from '../enums/PaginationEnum';
import { ColorEnum } from '../enums/ColorEnum';
import { Pagination } from './Common/Pagination';
import { UserSubpageHeader } from './User/UserSubpageHeader';
import { UserFeedsTable } from './Feed/UserFeedsTable';

interface UserFeedsViewProps {
    user: UserResponse | null;
    currentUser: UserResponse | null;
    feeds: FeedResponse[];
    relatedUsers: Record<string, UserResponse>;
    isMyProfile: boolean;
    isAdmin: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    limit: number;
    sort: string;
    filters: FeedFilterQuery;
    actionLoading: string | null;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
    onManageClick: (feed: FeedResponse) => void;
    interactions: any;
}

export const UserFeedsView: React.FC<UserFeedsViewProps> = ({
                                                                user, currentUser, feeds, relatedUsers, isMyProfile, isAdmin, loading, error, page, limit, sort, filters, actionLoading,
                                                                onFilterChange, onSortChange, onLimitChange, onPrevPage, onNextPage, onAddClick, onManageClick, interactions
                                                            }) => {
    const { t } = useTranslation();

    if (loading && feeds.length === 0) return <div className="container mt-5 text-center"><div className="spinner-border text-profile-primary" /></div>;
    if (error || !user) return <div className="container mt-5 alert alert-danger">{error ? t(error) : t('userNotFound')}</div>;

    const themeClass = ColorEnum.getClass(user.color);

    return (
        <div className={`container mt-4 mb-5 ${themeClass}`}>
            <UserSubpageHeader user={user} />

            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0 text-profile-primary fw-bold">{t('feeds')}</h4>
                        {isMyProfile && (
                            <button className="btn btn-profile-primary" onClick={onAddClick}>
                                {t('addFeed')}
                            </button>
                        )}
                    </div>

                    <div className="mb-3 d-flex flex-wrap gap-3 align-items-center">
                        <input name="text" placeholder={t('text')} value={filters.text || ''} onChange={onFilterChange} className="form-control w-auto" />
                        <select name="status" value={filters.status || ''} onChange={onFilterChange} className="form-select w-auto">
                            <option value="">{t('status')}</option>
                            {ElementStatusEnum.getOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <select value={sort} onChange={onSortChange} className="form-select w-auto ms-auto">
                            <option value="createdAt:desc">{t('sortCreatedDesc')}</option>
                            <option value="createdAt:asc">{t('sortCreatedAsc')}</option>
                        </select>
                        <select value={limit} onChange={onLimitChange} className="form-select w-auto">
                            {PaginationEnum.getOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>

                    {loading ? (
                        <div className="text-center my-4"><div className="spinner-border text-profile-primary" /></div>
                    ) : (
                        <>
                            <UserFeedsTable
                                feeds={feeds}
                                relatedUsers={relatedUsers}
                                currentUser={currentUser}
                                isMyProfile={isMyProfile}
                                isAdmin={isAdmin}
                                actionLoading={actionLoading}
                                onManageClick={onManageClick}
                                interactions={interactions}
                            />
                            <div className="mt-3">
                                <Pagination page={page} hasMore={feeds.length >= limit} onPrevPage={onPrevPage} onNextPage={onNextPage} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};