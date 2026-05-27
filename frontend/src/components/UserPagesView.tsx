import React from 'react';
import { useTranslation } from '../context/TranslationContext';
import { PageResponse } from '../api/responses/PageResponse';
import { UserResponse } from '../api/responses/UserResponse';
import { PageFilterQuery } from '../api/queries/PageFilterQuery';
import { ElementStatusEnum } from '../enums/ElementStatusEnum';
import { PaginationEnum } from '../enums/PaginationEnum';
import { ColorEnum } from '../enums/ColorEnum';
import { UserSubpageHeader } from './User/UserSubpageHeader';
import { Pagination } from './Common/Pagination';
import { UserPagesTable } from './Page/UserPagesTable';

interface UserPagesViewProps {
    user: UserResponse | null;
    currentUser: UserResponse | null;
    pages: PageResponse[];
    relatedUsers: Record<string, UserResponse>;
    isMyProfile: boolean;
    isAdmin: boolean;
    isOrganizer: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    limit: number;
    sort: string;
    filters: PageFilterQuery;
    actionLoading: string | null;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
    onManageClick: (pageObj: PageResponse) => void;
    interactions: any;
}

export const UserPagesView: React.FC<UserPagesViewProps> = ({
                                                                user, currentUser, pages, relatedUsers, isMyProfile, isAdmin, isOrganizer, loading, error, page, limit, sort, filters, actionLoading,
                                                                onFilterChange, onSortChange, onLimitChange, onPrevPage, onNextPage, onAddClick, onManageClick, interactions
                                                            }) => {
    const { t } = useTranslation();

    if (loading && pages.length === 0) return <div className="container mt-5 text-center"><div className="spinner-border text-profile-primary" /></div>;
    if (error || !user) return <div className="container mt-5 alert alert-danger">{error ? t(error) : t('userNotFound')}</div>;

    const themeClass = ColorEnum.getClass(user.color);

    return (
        <div className={`container mt-4 mb-5 ${themeClass}`}>
            <UserSubpageHeader user={user} />

            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0 text-profile-primary fw-bold">{t('pages')}</h4>
                        {(isMyProfile && isOrganizer) && (
                            <button className="btn btn-profile-primary" onClick={onAddClick}>
                                {t('addPage')}
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
                            <option value="title:desc">{t('title')} Z-A</option>
                            <option value="title:asc">{t('title')} A-Z</option>
                        </select>
                        <select value={limit} onChange={onLimitChange} className="form-select w-auto">
                            {PaginationEnum.getOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>

                    {loading ? (
                        <div className="text-center my-4"><div className="spinner-border text-profile-primary" /></div>
                    ) : (
                        <>
                            <UserPagesTable
                                pages={pages}
                                relatedUsers={relatedUsers}
                                currentUser={currentUser}
                                isMyProfile={isMyProfile}
                                isAdmin={isAdmin}
                                actionLoading={actionLoading}
                                onManageClick={onManageClick}
                                interactions={interactions}
                            />
                            <div className="mt-3">
                                <Pagination page={page} hasMore={pages.length >= limit} onPrevPage={onPrevPage} onNextPage={onNextPage} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};