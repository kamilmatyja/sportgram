import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {EventResponse} from '../../api/responses/EventResponse';
import {EventFilterQuery} from '../../api/queries/EventFilterQuery';
import {Pagination} from '../Common/Pagination';
import {EventsFilterBar} from './EventsFilterBar';
import {EventsTable} from './EventsTable';
import {Container, Stack, Card, Button, Spinner, Alert} from 'react-bootstrap';

interface EventsListViewProps {
    events: EventResponse[];
    isOrganizer: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    limit: number;
    sort: string;
    filters: EventFilterQuery;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
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
                                                                  onAddClick
                                                              }) => {
    const {t} = useTranslation();

    return (
        <Container className="mt-5 mb-5">
            <Stack direction="horizontal" className="justify-content-between align-items-center mb-4">
                <Card.Title as="h2" className="mb-0 text-profile-primary fw-bold">{t('events')}</Card.Title>
                {isOrganizer && (
                    <Button variant="profile-primary" onClick={onAddClick}>
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
                <Stack className="text-center mt-4">
                    <Spinner animation="border" className="text-profile-primary" />
                </Stack>
            ) : error ? (
                <Alert variant="danger" className="mt-3">{t(error)}</Alert>
            ) : (
                <>
                    <EventsTable events={events}/>
                    <Stack className="mt-3">
                        <Pagination
                            page={page}
                            hasMore={events.length >= limit}
                            onPrevPage={onPrevPage}
                            onNextPage={onNextPage}
                        />
                    </Stack>
                </>
            )}
        </Container>
    );
};