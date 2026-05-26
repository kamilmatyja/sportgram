import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {PushSubscriptionResponse} from '../api/responses/PushSubscriptionResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {PushSubscriptionFilterQuery} from '../api/queries/PushSubscriptionFilterQuery';
import {PushSubscriptionStatusEnum} from '../enums/PushSubscriptionStatusEnum';
import {PaginationEnum} from '../enums/PaginationEnum';
import {ColorEnum} from '../enums/ColorEnum';
import {formatDate} from '../utils/dateFormat';

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

    if (loading) return <div className="container mt-5 text-center">
        <div className="spinner-border"/>
    </div>;

    if (error || !user) return <div
        className="container mt-5 alert alert-danger">{error ? t(error) : t('userNotFound')}</div>;

    const hexColor = ColorEnum.getHex(user.color);

    return (
        <div className="container mt-4 mb-5" style={{'--theme-color': hexColor} as React.CSSProperties}>
            <div className="card shadow-sm mb-4">
                <div
                    className="card-img-top bg-secondary position-relative overflow-hidden border-top border-4 profile-theme-border profile-bg-container">
                    <img src={`data:image/webp;base64,${user.backgroundPhoto}`} alt="Background"
                         className="w-100 h-100 object-fit-cover"/>
                </div>
                <div className="card-body position-relative pt-5">
                    <img src={`data:image/webp;base64,${user.profilePhoto}`} alt="Profile"
                         className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar object-fit-cover"/>
                    <div className="mt-3">
                        <h2 className="mb-0 profile-theme-text">{user.firstName} {user.lastName}</h2>
                        <p className="text-muted mb-0">@{user.link}</p>
                    </div>
                </div>
            </div>
            <div className="d-flex flex-wrap gap-2 mb-3 overflow-x-auto">
                <a href={`/users/${user.link}`} className="btn btn-profile-outline-primary">
                    <i className="bi bi-arrow-left me-1"></i> {t('profile')}
                </a>
            </div>

            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0">{t('pushSubscriptions')}</h4>
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
                        </select>
                        <select value={limit} onChange={onLimitChange} className="form-select w-auto">
                            {PaginationEnum.getOptions(t).map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {loading && subscriptions.length === 0 ? <div className="text-center">
                        <div className="spinner-border"/>
                    </div> : (
                        <>
                            <div className="table-responsive-custom">
                                <table className="table table-bordered table-hover align-middle">
                                    <thead className="table-light">
                                    <tr>
                                        <th>{t('browserDevice')}</th>
                                        <th>{t('endpoint')}</th>
                                        <th>{t('status')}</th>
                                        <th>{t('createdAt')}</th>
                                        <th></th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {subscriptions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5}
                                                className="text-center text-muted">{t('noSubscriptions')}</td>
                                        </tr>
                                    ) : subscriptions.map(sub => (
                                        <tr key={sub.id}>
                                            <td>
                                                {sub.userAgent || '-'}
                                            </td>
                                            <td>
                                                {sub.endpoint}
                                            </td>
                                            <td>{PushSubscriptionStatusEnum.getOptions(t).find(opt => String(opt.value) === String(sub.status))?.label || sub.status}</td>
                                            <td>{formatDate(sub.createdAt)}</td>
                                            <td className="text-end">
                                                {(isMyProfile || isAdmin) && (
                                                    <button className="btn btn-sm btn-profile-outline-primary"
                                                            title={t('manage')} onClick={() => onManageClick(sub)}>
                                                        <i className="bi bi-gear" aria-hidden="true"></i>
                                                        <span className="visually-hidden">{t('manage')}</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <button className="btn btn-profile-outline-primary mx-2" disabled={page === 1}
                                        onClick={onPrevPage}>{t('prev')}</button>
                                <span>{t('page')} {page}</span>
                                <button className="btn btn-profile-outline-primary mx-2"
                                        disabled={subscriptions.length < limit}
                                        onClick={onNextPage}>{t('next')}</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};