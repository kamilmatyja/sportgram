import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {EventResponse} from '../../api/responses/EventResponse';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import {Link} from 'react-router-dom';
import BootstrapIcon from '../Common/BootstrapIcon';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Html';
import {Stack, Table, Image, Badge} from 'react-bootstrap';

interface EventsTableProps {
    events: EventResponse[];
}

export const EventsTable: React.FC<EventsTableProps> = ({events}) => {
    const {t} = useTranslation();

    return (
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
                    <TableHeaderCell />
                </TableRow>
                </TableHead>
                <TableBody>
                {events.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted">{t('noRecords')}</TableCell>
                    </TableRow>
                ) : events.map(ev => (
                    <TableRow key={ev.id}>
                        <TableCell className="text-center align-middle feed-photo-cell">
                            {ev.photo ? (
                                <Image src={`data:image/webp;base64,${ev.photo}`} alt="Photo" className="w-100 h-100 object-fit-cover rounded" />
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
                        <TableCell className="text-end">
                            <Link to={`/events/${ev.link}`} title={t('details')} className="btn btn-sm btn-outline-primary">
                                <BootstrapIcon name="box-arrow-in-right" aria-hidden="true" />
                                <Stack as="span" className="visually-hidden">{t('details')}</Stack>
                            </Link>
                        </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </Stack>
    );
};