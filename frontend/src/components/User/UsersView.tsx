import React from 'react';
import { Button } from 'react-bootstrap';

import { UsersFilterBar } from './UsersFilterBar';
import { UsersTable } from './UsersTable';
import { UserFilterQuery } from '../../api/queries/UserFilterQuery';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ListPageLayout } from '../Common/ListPageLayout';

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
    hasMore: boolean;
    onPrevPage: () => void;
    onNextPage: () => void;
    isAdmin?: boolean;
    onAddUserClick?: () => void;
}

export default function UsersView({
    filters,
    onFilterChange,
    sort,
    onSortChange,
    limit,
    onLimitChange,
    users,
    loading,
    error,
    page,
    hasMore,
    onPrevPage,
    onNextPage,
    isAdmin,
    onAddUserClick,
}: UsersViewProps) {
    const { t } = useTranslation();

    return (
        <ListPageLayout
            title={t('userTitle')}
            actions={
                isAdmin && (
                    <Button variant="primary" onClick={onAddUserClick}>
                        {t('addUser')}
                    </Button>
                )
            }
            filters={
                <UsersFilterBar
                    filters={filters}
                    sort={sort}
                    limit={limit}
                    onFilterChange={onFilterChange}
                    onSortChange={onSortChange}
                    onLimitChange={onLimitChange}
                />
            }
            loading={loading && users.length === 0}
            error={error}
            page={page}
            hasMore={hasMore}
            onPrevPage={onPrevPage}
            onNextPage={onNextPage}
        >
            <UsersTable users={users} />
        </ListPageLayout>
    );
}
