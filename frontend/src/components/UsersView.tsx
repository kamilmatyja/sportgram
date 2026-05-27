import React from 'react';
import { useTranslation } from '../context/TranslationContext';
import { UserResponse } from '../api/responses/UserResponse';
import { UserFilterQuery } from '../api/queries/UserFilterQuery';
import { UsersFilterBar } from './Users/UsersFilterBar';
import { UsersTable } from './Users/UsersTable';
import { Pagination } from './Common/Pagination';

interface UsersViewProps {
    filters: UserFilterQuery;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    sort: string;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    limit: number;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    users: UserResponse[];
    loading: boolean;
    error: string | null;
    page: number;
    onPrevPage: () => void;
    onNextPage: () => void;
    isAdmin?: boolean;
    onAddUserClick?: () => void;
}

export default function UsersView({
                                      filters, onFilterChange, sort, onSortChange, limit, onLimitChange,
                                      users, loading, error, page, onPrevPage, onNextPage, isAdmin, onAddUserClick
                                  }: UsersViewProps) {
    const { t } = useTranslation();

    return (
        <div className="container mt-5 mb-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="mb-0 profile-theme-text">{t('userTitle')}</h2>
                {isAdmin && (
                    <button className="btn btn-profile-primary" onClick={onAddUserClick}>
                        {t('addUser')}
                    </button>
                )}
            </div>

            <UsersFilterBar
                filters={filters}
                sort={sort}
                limit={limit}
                onFilterChange={onFilterChange}
                onSortChange={onSortChange}
                onLimitChange={onLimitChange}
            />

            <div className="mb-3" />

            {loading ? (
                <div className="text-center">
                    <div className="spinner-border text-profile-primary" />
                </div>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : (
                <>
                    <UsersTable users={users} />
                    <Pagination
                        page={page}
                        hasMore={users.length >= limit}
                        onPrevPage={onPrevPage}
                        onNextPage={onNextPage}
                    />
                </>
            )}
        </div>
    );
}