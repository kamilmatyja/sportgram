import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {PushSubscriptionResponse} from '../../api/responses/PushSubscriptionResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {PushSubscriptionFilterQuery} from '../../api/queries/PushSubscriptionFilterQuery';
import {PaginationEnum} from '../../enums/PaginationEnum';
import {ColorEnum} from '../../enums/ColorEnum';
import {UserSubpageHeader} from './UserSubpageHeader';
import {Pagination} from '../Common/Pagination';
import {UserPushSubscriptionsTable} from '../PushSubscription/UserPushSubscriptionsTable';

interface UserPushSubscriptionsViewProps {
    user: UserResponse | null;
    subscriptions: PushSubscriptionResponse[];
    isMyProfile: boolean;
    isAdmin: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    limit: number;
    sort: string;
    filters: PushSubscriptionFilterQuery;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
    onManageClick: (subscription: PushSubscriptionResponse) => void;
}

export const UserPushSubscriptionsView: React.FC<UserPushSubscriptionsViewProps> = ({
                                                                                        user,
                                                                                        subscriptions,
                                                                                        isMyProfile,
                                                                                        isAdmin,
                                                                                        loading,
                                                                                        error,
                                                                                        page,
                                                                                        limit,
                                                                                        sort,
                                                                                        filters,
                                                                                        onFilterChange,
                                                                                        onSortChange,
                                                                                        onLimitChange,
                                                                                        onPrevPage,
                                                                                        onNextPage,
                                                                                        onAddClick,
                                                                                        onManageClick
                                                                                    }) => {
    const {t} = useTranslation();

    if (loading && subscriptions.length === 0) return <div className="container mt-5 text-center">
        <div className="spinner-border text-profile-primary"/>
    </div>;
    if (error || !user) return <div
        className="container mt-5 alert alert-danger">{error ? t(error) : t('userNotFound')}</div>;

    const themeClass = ColorEnum.getClass(user.color);

    return (
        <div className={`container mt-4 mb-5 ${themeClass}`}>
            <UserSubpageHeader user={user}/>

            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0 text-profile-primary fw-bold">{t('pushSubscriptions')}</h4>
                        {isMyProfile && (
                            <button className="btn btn-profile-primary" onClick={onAddClick}>
                                {t('addSubscription')}
                            </button>
                        )}
                    </div>

                    <div className="mb-3 d-flex flex-wrap gap-3 align-items-center">
                        <input name="endpoint" placeholder={t('endpoint')} value={filters.endpoint || ''}
                               onChange={onFilterChange} className="form-control w-auto"/>
                        <select value={sort} onChange={onSortChange} className="form-select w-auto ms-auto">
                            <option value="createdAt:desc">{t('sortCreatedDesc')}</option>
                            <option value="createdAt:asc">{t('sortCreatedAsc')}</option>
                            <option value="endpoint:asc">{t('endpoint')} A-Z</option>
                            <option value="endpoint:desc">{t('endpoint')} Z-A</option>
                        </select>
                        <select value={limit} onChange={onLimitChange} className="form-select w-auto">
                            {PaginationEnum.getOptions(t).map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {loading ? (
                        <div className="text-center my-4">
                            <div className="spinner-border text-profile-primary"/>
                        </div>
                    ) : (
                        <>
                            <UserPushSubscriptionsTable
                                subscriptions={subscriptions}
                                isMyProfile={isMyProfile}
                                isAdmin={isAdmin}
                                onManageClick={onManageClick}
                            />
                            <div className="mt-3">
                                <Pagination page={page} hasMore={subscriptions.length >= limit} onPrevPage={onPrevPage}
                                            onNextPage={onNextPage}/>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};