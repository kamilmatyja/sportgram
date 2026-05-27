import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {EventResponse} from '../../api/responses/EventResponse';
import {EventFilterQuery} from '../../api/queries/EventFilterQuery';
import {Pagination} from '../Common/Pagination';
import {EventsFilterBar} from './EventsFilterBar';
import {EventsTable} from './EventsTable';

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
        <div className="container mt-5 mb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0 text-profile-primary fw-bold">{t('events')}</h2>
                {isOrganizer && (
                    <button className="btn btn-profile-primary" onClick={onAddClick}>
                        {t('addEvent')}
                    </button>
                )}
            </div>

            <EventsFilterBar
                filters={filters}
                sort={sort}
                limit={limit}
                onFilterChange={onFilterChange}
                onSortChange={onSortChange}
                onLimitChange={onLimitChange}
            />

            {loading && events.length === 0 ? (
                <div className="text-center mt-4">
                    <div className="spinner-border text-profile-primary"/>
                </div>
            ) : error ? (
                <div className="alert alert-danger mt-3">{t(error)}</div>
            ) : (
                <>
                    <EventsTable events={events}/>
                    <div className="mt-3">
                        <Pagination
                            page={page}
                            hasMore={events.length >= limit}
                            onPrevPage={onPrevPage}
                            onNextPage={onNextPage}
                        />
                    </div>
                </>
            )}
        </div>
    );
};