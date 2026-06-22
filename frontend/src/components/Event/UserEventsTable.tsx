import React, {useState} from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {EventResponse} from '../../api/responses/EventResponse';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import {EventListsManager} from './EventListsManager';
import {Link} from 'react-router-dom';
import BootstrapIcon from '../Common/BootstrapIcon';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Html';
import {Stack, Table, Image, Badge, Button, Card} from 'react-bootstrap';

interface UserEventsTableProps {
    events: EventResponse[];
    isMyProfile: boolean;
    isAdmin: boolean;
    actionLoading: string | null;
    onManageClick: (eventObj: EventResponse) => void;
    interactions: any;
}

export const UserEventsTable: React.FC<UserEventsTableProps> = ({
                                                                    events,
                                                                    isMyProfile,
                                                                    isAdmin,
                                                                    onManageClick,
                                                                    interactions
                                                                }) => {
    const {t} = useTranslation();
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const toggleRow = (id: string) => {
        setExpandedRow(prev => prev === id ? null : id);
    };

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
                    <TableHeaderCell>{t('details')}</TableHeaderCell>
                    <TableHeaderCell />
                </TableRow>
                </TableHead>
                <TableBody>
                {events.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted">{t('noRecords')}</TableCell>
                    </TableRow>
                ) : events.map(ev => (
                    <React.Fragment key={ev.id}>
                        <TableRow>
                            <TableCell className="text-center align-middle feed-photo-cell">
                                {ev.photo ? (
                                    <Image src={`data:image/webp;base64,${ev.photo}`} alt="Photo" className="w-100 h-100 object-fit-cover" />
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
                            <TableCell>
                                <Button variant="outline-secondary" size="sm" onClick={() => toggleRow(ev.id)}>
                                    <BootstrapIcon name={expandedRow === ev.id ? 'chevron-up' : 'chevron-down'} /> {t('lists')} / {t('results')}
                                </Button>
                            </TableCell>
                            <TableCell className="text-end">
                                {(isMyProfile || isAdmin) && (
                                    <Button variant="profile-outline-primary" size="sm" title={t('manage')} onClick={() => onManageClick(ev)}>
                                        <BootstrapIcon name="gear" aria-hidden="true" />
                                        <Stack as="span" className="visually-hidden">{t('manage')}</Stack>
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                        {expandedRow === ev.id && (
                            <TableRow className="bg-light">
                                <TableCell colSpan={8} className="p-0">
                                    <Card className="border rounded border-profile-primary bg-white m-3">
                                        <EventListsManager
                                            eventObj={ev}
                                            isMyProfile={isMyProfile}
                                            isAdmin={isAdmin}
                                            interactions={interactions}
                                        />
                                    </Card>
                                </TableCell>
                            </TableRow>
                        )}
                    </React.Fragment>
                ))}
                </TableBody>
            </Table>
        </Stack>
    );
};