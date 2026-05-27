import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {NotificationResponse} from '../api/responses/NotificationResponse';
import {UserResponse} from '../api/responses/UserResponse';
import {NotificationFilterQuery} from '../api/queries/NotificationFilterQuery';
import {NotificationStatusEnum} from '../enums/NotificationStatusEnum';
import {PaginationEnum} from '../enums/PaginationEnum';
import {ColorEnum} from '../enums/ColorEnum';
import {UserSubpageHeader} from './User/UserSubpageHeader';
import {Pagination} from './Common/Pagination';
import {UserNotificationsTable} from './Notification/UserNotificationsTable';

interface UserNotificationsViewProps {
    user: UserResponse | null;
    notifications: NotificationResponse[];
    isMyProfile: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    limit: number;
    sort: string;
    filters: NotificationFilterQuery;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onManageClick: (notification: NotificationResponse) => void;
}

export const UserNotificationsView: React.FC<UserNotificationsViewProps> = ({
                                                                                user, notifications, isMyProfile, loading, error, page, limit, sort, filters,
                                                                                onFilterChange, onSortChange, onLimitChange, onPrevPage, onNextPage, onManageClick
                                                                            }) => {
    const {t} = useTranslation();

    if (loading && notifications.length === 0) return <div className="container mt-5 text-center"><div className="spinner-border text-profile-primary"/></div>;
    if (error || !user) return <div className="container mt-5 alert alert-danger">{error ? t(error) : t('userNotFound')}</div>;

    const themeClass = ColorEnum.getClass(user.color);

    return (
        <div className={`container mt-4 mb-5 ${themeClass}`}>
            <UserSubpageHeader user={user} />

            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0 text-profile-primary fw-bold">{t('notifications')}</h4>
                    </div>

                    <div className="mb-3 d-flex flex-wrap gap-3 align-items-center">
                        <input name="text" placeholder={t('text')} value={filters.text || ''} onChange={onFilterChange} className="form-control w-auto"/>
                        <select name="status" value={filters.status || ''} onChange={onFilterChange} className="form-select w-auto">
                            <option value="">{t('status')}</option>
                            {NotificationStatusEnum.getOptions(t).map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
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

                    {loading ? (
                        <div className="text-center my-4"><div className="spinner-border text-profile-primary"/></div>
                    ) : (
                        <>
                            <UserNotificationsTable
                                notifications={notifications}
                                isMyProfile={isMyProfile}
                                onManageClick={onManageClick}
                            />
                            <div className="mt-3">
                                <Pagination page={page} hasMore={notifications.length >= limit} onPrevPage={onPrevPage} onNextPage={onNextPage} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};