import React from 'react';
import { Container, Stack, Button, Spinner, Alert } from 'react-bootstrap';

import { UsersFilterBar } from './UsersFilterBar';
import { UsersTable } from './UsersTable';
import { UserFilterQuery } from '../../api/queries/UserFilterQuery';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { Pagination } from '../Common/Pagination';

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
    onPrevPage,
    onNextPage,
    isAdmin,
    onAddUserClick,
}: UsersViewProps) {
    const { t } = useTranslation();

    return (
        <Container className="py-5">
            <Stack direction="horizontal" className="justify-content-between align-items-center mb-4">
                <Stack as="h2" className="mb-0 fw-bold text-primary">
                    {t('userTitle')}
                </Stack>
                {isAdmin && (
                    <Button variant="primary" onClick={onAddUserClick}>
                        {t('addUser')}
                    </Button>
                )}
            </Stack>

            <UsersFilterBar
                filters={filters}
                sort={sort}
                limit={limit}
                onFilterChange={onFilterChange}
                onSortChange={onSortChange}
                onLimitChange={onLimitChange}
            />

            {loading && users.length === 0 ? (
                <Stack className="text-center p-5">
                    <Spinner animation="border" variant="primary" />
                </Stack>
            ) : error ? (
                <Alert variant="danger">{error}</Alert>
            ) : (
                <Stack gap={4}>
                    <UsersTable users={users} />
                    <Pagination
                        page={page}
                        hasMore={users.length >= limit}
                        onPrevPage={onPrevPage}
                        onNextPage={onNextPage}
                    />
                </Stack>
            )}
        </Container>
    );
}
