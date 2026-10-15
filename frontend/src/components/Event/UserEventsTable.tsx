import React, { useState } from 'react';
import { Stack, Table, Button, Card } from 'react-bootstrap';

import { EventListsManager } from './EventListsManager';
import { EventHeaderCells, EventRowCells } from './EventRowCells';
import { EventResponse } from '../../api/responses/EventResponse';
import { useTranslation } from '../../context/TranslationContext';
import { type EventInteractions } from '../../services/Event/useEventInteractions';
import BootstrapIcon from '../Common/BootstrapIcon';
import { IconButton } from '../Common/IconButton';
import { EmptyTableRow, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface UserEventsTableProps {
    events: EventResponse[];
    isMyProfile: boolean;
    isAdmin: boolean;
    onManageClick: (eventObj: EventResponse) => void;
    interactions: EventInteractions;
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
            <Table bordered hover className="align-middle mb-0 shadow-sm">
                <TableHead className="table-light">
                    <TableRow>
                        <EventHeaderCells />
                        <TableHeaderCell>{t('details')}</TableHeaderCell>
                        <TableHeaderCell className="text-end">{t('manage')}</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {events.length === 0 ? (
                        <EmptyTableRow colSpan={8} />
                    ) : (
                        events.map((ev) => (
                            <React.Fragment key={ev.id}>
                                <TableRow>
                                    <EventRowCells eventObj={ev} />
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
                                            <IconButton icon="gear" onClick={() => onManageClick(ev)} />
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
