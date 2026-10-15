import React from 'react';
import { Card, Stack, Table, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { EventFilterQuery } from '../../api/queries/EventFilterQuery';
import { EventResponse } from '../../api/responses/EventResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import { buildSortOptions } from '../../utils/options';
import { Base64Image } from '../Common/Base64Image';
import { EnumBadge } from '../Common/EnumBadge';
import { FilterBar, FilterInput, FilterSelect, SortLimitSelect } from '../Common/FilterBar';
import { Pagination } from '../Common/Pagination';
import { EmptyTableRow, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface PageEventsTableProps {
    events: EventResponse[];
    eventsLoading: boolean;
    eventPage: number;
    eventHasMore: boolean;
    eventLimit: number;
    eventSort: string;
    eventFilters: EventFilterQuery;
    handleEventFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleEventSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleEventLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleEventPrevPage: () => void;
    handleEventNextPage: () => void;
    paginationVariant?: string;
}

export const PageEventsTable: React.FC<PageEventsTableProps> = ({
    events,
    eventsLoading,
    eventPage,
    eventHasMore,
    eventLimit,
    eventSort,
    eventFilters,
    handleEventFilterChange,
    handleEventSortChange,
    handleEventLimitChange,
    handleEventPrevPage,
    handleEventNextPage,
    paginationVariant,
}) => {
    const { t } = useTranslation();
    const statusOptions = ElementStatusEnum.getOptions(t);
    const sortOptions = buildSortOptions(t, ['createdAt', 'startedAt', 'endedAt', 'title', 'location', 'status']);

    return (
        <Card className="shadow-sm">
            <Card.Body>
                <Card.Title as="h5" className="mb-3 text-profile-primary fw-bold">
                    {t('events')}
                </Card.Title>

                <FilterBar>
                    <FilterInput
                        name="title"
                        placeholder={t('title')}
                        value={eventFilters.title || ''}
                        onChange={handleEventFilterChange}
                    />
                    <FilterSelect
                        name="status"
                        value={eventFilters.status || ''}
                        onChange={handleEventFilterChange}
                        options={statusOptions}
                        placeholder={t('status')}
                    />
                    <SortLimitSelect
                        sortOptions={sortOptions}
                        sort={eventSort}
                        limit={eventLimit}
                        onSortChange={handleEventSortChange}
                        onLimitChange={handleEventLimitChange}
                    />
                </FilterBar>

                {eventsLoading ? (
                    <Stack className="text-center p-4">
                        <Spinner animation="border" variant="primary" />
                    </Stack>
                ) : (
                    <>
                        <Stack className="table-responsive-custom">
                            <Table bordered hover className="align-middle mb-0 shadow-sm">
                                <TableHead className="table-light">
                                    <TableRow>
                                        <TableHeaderCell>{t('photo')}</TableHeaderCell>
                                        <TableHeaderCell>{t('title')}</TableHeaderCell>
                                        <TableHeaderCell>{t('location')}</TableHeaderCell>
                                        <TableHeaderCell>{t('startedAt')}</TableHeaderCell>
                                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {events.length === 0 ? (
                                        <EmptyTableRow colSpan={5} />
                                    ) : (
                                        events.map((ev) => (
                                            <TableRow key={ev.id}>
                                                <TableCell className="feed-photo-cell">
                                                    <Base64Image
                                                        data={ev.photo}
                                                        fallback={
                                                            <Stack as="span" className="text-muted">
                                                                -
                                                            </Stack>
                                                        }
                                                        fluid
                                                        rounded
                                                        className="feed-photo shadow-sm"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Link to={`/events/${ev.link}`} className="text-decoration-none">
                                                        {ev.title}
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="small">{ev.location}</TableCell>
                                                <TableCell className="small text-muted">
                                                    {formatDate(ev.startedAt)}
                                                </TableCell>
                                                <TableCell>
                                                    <EnumBadge options={statusOptions} value={ev.status} />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Stack>
                        <Stack className="mt-3">
                            <Pagination
                                page={eventPage}
                                hasMore={eventHasMore}
                                onPrevPage={handleEventPrevPage}
                                onNextPage={handleEventNextPage}
                                variant={paginationVariant}
                            />
                        </Stack>
                    </>
                )}
            </Card.Body>
        </Card>
    );
};
