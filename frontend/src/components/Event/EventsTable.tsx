import React from 'react';
import { Stack, Table, Image, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { EventResponse } from '../../api/responses/EventResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface EventsTableProps {
    events: EventResponse[];
}

export const EventsTable: React.FC<EventsTableProps> = ({ events }) => {
    const { t } = useTranslation();

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0 shadow-sm">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('photo')}</TableHeaderCell>
                        <TableHeaderCell>{t('title')}</TableHeaderCell>
                        <TableHeaderCell>{t('location')}</TableHeaderCell>
                        <TableHeaderCell>{t('startedAt')}</TableHeaderCell>
                        <TableHeaderCell>{t('endedAt')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell className="text-end">{t('details')}</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {events.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted">
                                {t('noRecords')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        events.map((ev) => (
                            <TableRow key={ev.id}>
                                <TableCell className="feed-photo-cell text-center">
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
                                <TableCell className="small">{formatDate(ev.startedAt)}</TableCell>
                                <TableCell className="small">{formatDate(ev.endedAt)}</TableCell>
                                <TableCell>
                                    <Badge bg="light" text="dark" className="border profile-theme-border">
                                        {ElementStatusEnum.getOptions(t).find(
                                            (opt) => String(opt.value) === String(ev.status),
                                        )?.label || ev.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-end">
                                    <Link
                                        to={`/events/${ev.link}`}
                                        className="btn btn-sm btn-outline-primary rounded-circle shadow-sm"
                                    >
                                        <BootstrapIcon name="box-arrow-in-right" />
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </Stack>
    );
};
