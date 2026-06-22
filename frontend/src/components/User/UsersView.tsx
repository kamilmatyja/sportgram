import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {UserResponse} from '../../api/responses/UserResponse';
import {UserFilterQuery} from '../../api/queries/UserFilterQuery';
import {UsersFilterBar} from './UsersFilterBar';
import {UsersTable} from './UsersTable';
import {Pagination} from '../Common/Pagination';
import {Container, Stack, Button, Spinner, Alert} from 'react-bootstrap';

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
    const {t} = useTranslation();

    return (
        <Container className="mt-5 mb-5">
            <Stack direction="horizontal" className="justify-content-between align-items-center mb-3">
                <Stack as="h2" className="mb-0 profile-theme-text fw-bold">{t('userTitle')}</Stack>
                {isAdmin && (
                    <Button variant="profile-primary" onClick={onAddUserClick}>
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

            {loading ? (
                <Stack className="text-center">
                    <Spinner animation="border" className="text-profile-primary"/>
                </Stack>
            ) : error ? (
                <Alert variant="danger">{error}</Alert>
            ) : (
                <>
                    <UsersTable users={users}/>
                    <Stack className="mt-3">
                        <Pagination
                            page={page}
                            hasMore={users.length >= limit}
                            onPrevPage={onPrevPage}
                            onNextPage={onNextPage}
                        />
                    </Stack>
                </>
            )}
        </Container>
    );
}