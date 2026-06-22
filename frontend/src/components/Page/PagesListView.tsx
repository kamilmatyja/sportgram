import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {PageResponse} from '../../api/responses/PageResponse';
import {PageFilterQuery} from '../../api/queries/PageFilterQuery';
import {Pagination} from '../Common/Pagination';
import {PagesFilterBar} from './PagesFilterBar';
import {PagesTable} from './PagesTable';
import {Container, Stack, Card, Button, Spinner, Alert} from 'react-bootstrap';

interface PagesListViewProps {
    pages: PageResponse[];
    isOrganizer: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    limit: number;
    sort: string;
    filters: PageFilterQuery;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
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
                                                                onAddClick
                                                            }) => {
    const {t} = useTranslation();

    return (
        <Container className="mt-5 mb-5">
            <Stack direction="horizontal" className="justify-content-between align-items-center mb-4">
                <Card.Title as="h2" className="mb-0 text-profile-primary fw-bold">{t('pages')}</Card.Title>
                {isOrganizer && (
                    <Button variant="profile-primary" onClick={onAddClick}>
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
                <Stack className="text-center mt-4">
                    <Spinner animation="border" className="text-profile-primary"/>
                </Stack>
            ) : error ? (
                <Alert variant="danger" className="mt-3">{t(error)}</Alert>
            ) : (
                <>
                    <PagesTable pages={pages}/>
                    <Stack className="mt-3">
                        <Pagination
                            page={page}
                            hasMore={pages.length >= limit}
                            onPrevPage={onPrevPage}
                            onNextPage={onNextPage}
                        />
                    </Stack>
                </>
            )}
        </Container>
    );
};