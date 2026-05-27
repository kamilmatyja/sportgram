import React from 'react';
import { useTranslation } from '../context/TranslationContext';
import { FriendResponse } from '../api/responses/FriendResponse';
import { UserResponse } from '../api/responses/UserResponse';
import { FriendFilterQuery } from '../api/queries/FriendFilterQuery';
import { FriendStatusEnum } from '../enums/FriendStatusEnum';
import { PaginationEnum } from '../enums/PaginationEnum';
import { ColorEnum } from '../enums/ColorEnum';
import { UserSubpageHeader } from './User/UserSubpageHeader';
import { Pagination } from './Common/Pagination';
import { UserFriendsTable } from './Friend/UserFriendsTable';

interface UserFriendsViewProps {
    user: UserResponse | null;
    friends: FriendResponse[];
    relatedUsers: Record<string, UserResponse>;
    isMyProfile: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    limit: number;
    sort: string;
    filters: FriendFilterQuery;
    onFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
    onManageClick: (friend: FriendResponse) => void;
}

export const UserFriendsView: React.FC<UserFriendsViewProps> = ({
                                                                    user, friends, relatedUsers, isMyProfile, loading, error, page, limit, sort, filters,
                                                                    onFilterChange, onSortChange, onLimitChange, onPrevPage, onNextPage, onAddClick, onManageClick
                                                                }) => {
    const { t } = useTranslation();

    if (loading && friends.length === 0) return <div className="container mt-5 text-center"><div className="spinner-border text-profile-primary" /></div>;
    if (error || !user) return <div className="container mt-5 alert alert-danger">{error ? t(error) : t('userNotFound')}</div>;

    const themeClass = ColorEnum.getClass(user.color);

    return (
        <div className={`container mt-4 mb-5 ${themeClass}`}>
            <UserSubpageHeader user={user} title={t('friendsList')} />

            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0 text-profile-primary fw-bold">{t('friendsList')}</h4>
                        {isMyProfile && (
                            <button className="btn btn-profile-primary" onClick={onAddClick}>
                                <i className="bi bi-person-plus me-1"></i> {t('addFriend')}
                            </button>
                        )}
                    </div>

                    <div className="mb-3 d-flex flex-wrap gap-3 align-items-center">
                        <select name="status" value={filters.status || ''} onChange={onFilterChange} className="form-select w-auto">
                            <option value="">{t('status')}</option>
                            {FriendStatusEnum.getOptions(t).map(opt => (
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
                        <div className="text-center my-4"><div className="spinner-border text-profile-primary" /></div>
                    ) : (
                        <>
                            <UserFriendsTable
                                friends={friends}
                                relatedUsers={relatedUsers}
                                isMyProfile={isMyProfile}
                                onManageClick={onManageClick}
                            />
                            <div className="mt-3">
                                <Pagination page={page} hasMore={friends.length >= limit} onPrevPage={onPrevPage} onNextPage={onNextPage} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};