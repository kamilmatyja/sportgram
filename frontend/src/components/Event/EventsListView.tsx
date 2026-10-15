import React from 'react';
import { Button } from 'react-bootstrap';

import { EventsFilterBar } from './EventsFilterBar';
import { EventsTable } from './EventsTable';
import { EventFilterQuery } from '../../api/queries/EventFilterQuery';
import { EventResponse } from '../../api/responses/EventResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ListPageLayout } from '../Common/ListPageLayout';

interface EventsListViewProps {
    events: EventResponse[];
    isOrganizer: boolean;
    loading: boolean;
    error: string | null;
    page: number;
    hasMore: boolean;
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
    hasMore,
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
        <ListPageLayout
            title={t('events')}
            actions={
                isOrganizer && (
                    <Button variant="primary" onClick={onAddClick}>
                        {t('addEvent')}
                    </Button>
                )
            }
            filters={
                <EventsFilterBar
                    filters={filters}
                    sort={sort}
                    limit={limit}
                    onFilterChange={onFilterChange}
                    onSortChange={onSortChange}
                    onLimitChange={onLimitChange}
                />
            }
            loading={loading && events.length === 0}
            error={error}
            page={page}
            hasMore={hasMore}
            onPrevPage={onPrevPage}
            onNextPage={onNextPage}
        >
            <EventsTable events={events} />
        </ListPageLayout>
    );
};
