import React from 'react';
import { Stack, Table } from 'react-bootstrap';

import { EventHeaderCells, EventRowCells } from './EventRowCells';
import { EventResponse } from '../../api/responses/EventResponse';
import { useTranslation } from '../../context/TranslationContext';
import { IconButton } from '../Common/IconButton';
import { EmptyTableRow, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

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
                        <EventHeaderCells />
                        <TableHeaderCell className="text-end">{t('details')}</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {events.length === 0 ? (
                        <EmptyTableRow colSpan={7} />
                    ) : (
                        events.map((ev) => (
                            <TableRow key={ev.id}>
                                <EventRowCells eventObj={ev} />
                                <TableCell className="text-end">
                                    <IconButton
                                        icon="box-arrow-in-right"
                                        to={`/events/${ev.link}`}
                                        variant="outline-primary"
                                    />
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </Stack>
    );
};
