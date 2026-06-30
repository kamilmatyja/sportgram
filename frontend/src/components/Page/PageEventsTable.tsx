import React from 'react';
import { Card, Stack, Form, Table, Image, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { EventFilterQuery } from '../../api/queries/EventFilterQuery';
import { EventResponse } from '../../api/responses/EventResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { PaginationEnum } from '../../enums/PaginationEnum';
import { formatDate } from '../../utils/dateFormat';
import { Pagination } from '../Common/Pagination';
import SelectOptions, { type SelectOption } from '../Common/SelectOptions';
import { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface PageEventsTableProps {
    events: EventResponse[];
    eventsLoading: boolean;
    eventPage: number;
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
    const statusOptions = ElementStatusEnum.getOptions(t) as SelectOption[];
    const limitOptions = PaginationEnum.getOptions(t) as SelectOption[];
    const sortOptions: SelectOption[] = [
        { value: 'createdAt:desc', label: t('sortCreatedDesc') },
        { value: 'createdAt:asc', label: t('sortCreatedAsc') },
        { value: 'startedAt:desc', label: `${t('startedAt')} Z-A` },
        { value: 'startedAt:asc', label: `${t('startedAt')} A-Z` },
    ];

    return (
        <Card className="shadow-sm">
            <Card.Body>
                <Card.Title as="h5" className="mb-4 text-profile-primary fw-bold">
                    {t('events')}
                </Card.Title>

                <Stack direction="horizontal" gap={2} className="mb-3 flex-wrap align-items-center">
                    <Form.Control
                        name="title"
                        placeholder={t('title')}
                        value={eventFilters.title || ''}
                        onChange={handleEventFilterChange}
                        className="w-auto"
                    />
                    <Form.Select
                        name="status"
                        value={eventFilters.status || ''}
                        onChange={handleEventFilterChange}
                        className="w-auto"
                    >
                        <SelectOptions options={statusOptions} placeholder={t('status')} />
                    </Form.Select>
                    <Form.Select value={eventSort} onChange={handleEventSortChange} className="w-auto ms-auto">
                        <SelectOptions options={sortOptions} />
                    </Form.Select>
                    <Form.Select value={eventLimit} onChange={handleEventLimitChange} className="w-auto">
                        <SelectOptions options={limitOptions} />
                    </Form.Select>
                </Stack>

                {eventsLoading ? (
                    <Stack className="text-center p-4">
                        <Spinner animation="border" variant="primary" />
                    </Stack>
                ) : (
                    <>
                        <Stack className="table-responsive-custom">
                            <Table bordered hover className="align-middle mb-0">
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
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted">
                                                {t('noRecords')}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        events.map((ev) => (
                                            <TableRow key={ev.id}>
                                                <TableCell className="feed-photo-cell">
                                                    {ev.photo ? (
                                                        <Image
                                                            src={`data:image/webp;base64,${ev.photo}`}
                                                            fluid
                                                            rounded
                                                            className="feed-photo shadow-sm"
                                                        />
                                                    ) : (
                                                        <Stack as="span" className="text-muted">
                                                            -
                                                        </Stack>
                                                    )}
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
                                                    <Badge
                                                        bg="light"
                                                        text="dark"
                                                        className="border profile-theme-border"
                                                    >
                                                        {ElementStatusEnum.getOptions(t).find(
                                                            (o) => o.value === ev.status,
                                                        )?.label || ev.status}
                                                    </Badge>
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
                                hasMore={events.length >= eventLimit}
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
