import React from 'react';
import { Container, Stack, Button, Spinner, Alert } from 'react-bootstrap';

import { PagesFilterBar } from './PagesFilterBar';
import { PagesTable } from './PagesTable';
import { PageFilterQuery } from '../../api/queries/PageFilterQuery';
import { PageResponse } from '../../api/responses/PageResponse';
import { useTranslation } from '../../context/TranslationContext';
import { Pagination } from '../Common/Pagination';

interface PagesListViewProps {
    pages: PageResponse[];
    isOrganizer: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    limit: number;
    sort: string;
    filters: PageFilterQuery;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
}

export const PagesListView: React.FC<PagesListViewProps> = ({
    pages,
    isOrganizer,
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
}) => {
    const { t } = useTranslation();

    return (
        <Container className="py-5">
            <Stack direction="horizontal" className="justify-content-between align-items-center mb-4">
                <Stack as="h2" className="mb-0 fw-bold text-primary">
                    {t('pages')}
                </Stack>
                {isOrganizer && (
                    <Button variant="primary" onClick={onAddClick}>
                        {t('addPage')}
                    </Button>
                )}
            </Stack>

            <PagesFilterBar
                filters={filters}
                sort={sort}
                limit={limit}
                onFilterChange={onFilterChange}
                onSortChange={onSortChange}
                onLimitChange={onLimitChange}
            />

            {loading && pages.length === 0 ? (
                <Stack className="text-center p-5">
                    <Spinner animation="border" variant="primary" />
                </Stack>
            ) : error ? (
                <Alert variant="danger">{t(error)}</Alert>
            ) : (
                <Stack gap={4}>
                    <PagesTable pages={pages} />
                    <Pagination
                        page={page}
                        hasMore={pages.length >= limit}
                        onPrevPage={onPrevPage}
                        onNextPage={onNextPage}
                    />
                </Stack>
            )}
        </Container>
    );
};
