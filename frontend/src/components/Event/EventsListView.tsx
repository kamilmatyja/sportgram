import React from 'react';
import { Container, Stack, Button, Spinner, Alert } from 'react-bootstrap';

import { EventsFilterBar } from './EventsFilterBar';
import { EventsTable } from './EventsTable';
import { EventFilterQuery } from '../../api/queries/EventFilterQuery';
import { EventResponse } from '../../api/responses/EventResponse';
import { useTranslation } from '../../context/TranslationContext';
import { Pagination } from '../Common/Pagination';

interface EventsListViewProps {
    events: EventResponse[];
    isOrganizer: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    limit: number;
    sort: string;
    filters: EventFilterQuery;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onAddClick: () => void;
}

export const EventsListView: React.FC<EventsListViewProps> = ({
    events,
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
                    {t('events')}
                </Stack>
                {isOrganizer && (
                    <Button variant="primary" onClick={onAddClick}>
                        {t('addEvent')}
                    </Button>
                )}
            </Stack>

            <EventsFilterBar
                filters={filters}
                sort={sort}
                limit={limit}
                onFilterChange={onFilterChange}
                onSortChange={onSortChange}
                onLimitChange={onLimitChange}
            />

            {loading && events.length === 0 ? (
                <Stack className="text-center p-5">
                    <Spinner animation="border" variant="primary" />
                </Stack>
            ) : error ? (
                <Alert variant="danger">{t(error)}</Alert>
            ) : (
                <Stack gap={4}>
                    <EventsTable events={events} />
                    <Pagination
                        page={page}
                        hasMore={events.length >= limit}
                        onPrevPage={onPrevPage}
                        onNextPage={onNextPage}
                    />
                </Stack>
            )}
        </Container>
    );
};
