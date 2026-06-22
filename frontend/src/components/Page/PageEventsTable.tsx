import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {EventResponse} from '../../api/responses/EventResponse';
import {EventFilterQuery} from '../../api/queries/EventFilterQuery';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {PaginationEnum} from '../../enums/PaginationEnum';
import {formatDate} from '../../utils/dateFormat';
import {Pagination} from '../Common/Pagination';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Table.tsx';
import {Card, Stack, Form, Table, Image, Badge, Spinner} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import SelectOptions, {type SelectOption} from '../Common/SelectOptions';

interface PageEventsTableProps {
    events: EventResponse[];
    eventsLoading: boolean;
    eventPage: number;
    eventLimit: number;
    eventSort: string;
    eventFilters: EventFilterQuery;
    handleEventFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleEventSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleEventLimitChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleEventPrevPage: () => void;
    handleEventNextPage: () => void;
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
                                                                    handleEventNextPage
                                                                }) => {
    const {t} = useTranslation();
    const statusOptions = ElementStatusEnum.getOptions(t) as SelectOption[];
    const limitOptions = PaginationEnum.getOptions(t) as SelectOption[];
    const sortOptions: SelectOption[] = [
        {value: 'createdAt:desc', label: t('sortCreatedDesc')},
        {value: 'createdAt:asc', label: t('sortCreatedAsc')},
        {value: 'startedAt:desc', label: `${t('startedAt')} Z-A`},
        {value: 'startedAt:asc', label: `${t('startedAt')} A-Z`},
    ];

    return (
        <Card className="shadow-sm">
            <Card.Body>
                <Stack direction="horizontal" className="justify-content-between align-items-center mb-4">
                    <Card.Title as="h5" className="mb-0 text-profile-primary fw-bold">{t('events')}</Card.Title>
                </Stack>

                <Stack direction="horizontal" gap={3} className="mb-3 flex-wrap align-items-center">
                    <Form.Control
                        name="title"
                        placeholder={t('title')}
                        value={eventFilters.title || ''}
                        onChange={e => handleEventFilterChange(e as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>)}
                        className="w-auto"
                    />
                    <Form.Control
                        name="link"
                        placeholder={t('link')}
                        value={eventFilters.link || ''}
                        onChange={e => handleEventFilterChange(e as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>)}
                        className="w-auto"
                    />
                    <Form.Select
                        name="status"
                        value={eventFilters.status || ''}
                        onChange={e => handleEventFilterChange(e as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>)}
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

                {eventsLoading && events.length === 0 ? (
                    <Stack className="text-center my-4">
                        <Spinner animation="border" className="text-profile-primary" />
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
                                        <TableHeaderCell>{t('endedAt')}</TableHeaderCell>
                                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {events.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted">{t('noRecords')}</TableCell>
                                        </TableRow>
                                    ) : events.map(ev => (
                                        <TableRow key={ev.id}>
                                            <TableCell className="text-center align-middle feed-photo-cell">
                                                {ev.photo ? (
                                                    <Image src={`data:image/webp;base64,${ev.photo}`} alt="Photo"
                                                           className="w-100 h-100 object-fit-cover"/>
                                                ) : (
                                                    <Stack as="span" className="text-muted">-</Stack>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Link to={`/events/${ev.link}`} className="btn btn-link p-0 text-decoration-none">
                                                    {ev.title}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{ev.location}</TableCell>
                                            <TableCell>{formatDate(ev.startedAt)}</TableCell>
                                            <TableCell>{formatDate(ev.endedAt)}</TableCell>
                                            <TableCell>
                                                <Badge bg="light" text="dark" className="border profile-theme-border">
                                                    {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(ev.status))?.label || ev.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Stack>
                        <Stack className="mt-3">
                            <Pagination page={eventPage} hasMore={events.length >= eventLimit}
                                        onPrevPage={handleEventPrevPage} onNextPage={handleEventNextPage}/>
                        </Stack>
                    </>
                )}
            </Card.Body>
        </Card>
    );
};