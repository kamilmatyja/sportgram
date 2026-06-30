import React, { useState } from 'react';
import { Stack, Table, Image, Badge, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { EventListsManager } from './EventListsManager';
import { EventResponse } from '../../api/responses/EventResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

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
    interactions,
}) => {
    const { t } = useTranslation();
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

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
                        <TableHeaderCell className="text-end">{t('manage')}</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {events.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted">
                                {t('noRecords')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        events.map((ev) => (
                            <React.Fragment key={ev.id}>
                                <TableRow>
                                    <TableCell className="feed-photo-cell text-center">
                                        {ev.photo ? (
                                            <Image
                                                src={`data:image/webp;base64,${ev.photo}`}
                                                rounded
                                                fluid
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
                                    <TableCell>
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => setExpandedRow(expandedRow === ev.id ? null : ev.id)}
                                        >
                                            <BootstrapIcon
                                                name={expandedRow === ev.id ? 'chevron-up' : 'chevron-down'}
                                                className="me-1"
                                            />
                                            {t('lists')} / {t('results')}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-end">
                                        {(isMyProfile || isAdmin) && (
                                            <Button
                                                variant="profile-outline-primary"
                                                size="sm"
                                                onClick={() => onManageClick(ev)}
                                                className="rounded-circle shadow-sm"
                                            >
                                                <BootstrapIcon name="gear" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                                {expandedRow === ev.id && (
                                    <TableRow className="bg-light">
                                        <TableCell colSpan={8} className="p-3">
                                            <Card className="border-profile-primary shadow-sm">
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
                        ))
                    )}
                </TableBody>
            </Table>
        </Stack>
    );
};
