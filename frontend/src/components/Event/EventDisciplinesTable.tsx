import React from 'react';
import { Card, Table, Button, Stack } from 'react-bootstrap';

import { EventResponse } from '../../api/responses/EventResponse';
import { useTranslation } from '../../context/TranslationContext';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { getOptionLabel } from '../../utils/options';
import BootstrapIcon from '../Common/BootstrapIcon';
import { SectionHeader } from '../Common/SectionHeader';
import { EmptyTableRow, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface EventDisciplinesTableProps {
    eventObj: EventResponse;
    openListsModal: (distId: string) => void;
}

export const EventDisciplinesTable: React.FC<EventDisciplinesTableProps> = ({ eventObj, openListsModal }) => {
    const { t } = useTranslation();

    return (
        <Card className="shadow-sm mb-4">
            <Card.Body>
                <SectionHeader title={t('disciplinesAndDistances')} />

                <Stack className="table-responsive-custom">
                    <Table bordered hover className="align-middle mb-0 shadow-sm">
                        <TableHead className="table-light">
                            <TableRow>
                                <TableHeaderCell>{t('discipline')}</TableHeaderCell>
                                <TableHeaderCell>{t('distance')} [m]</TableHeaderCell>
                                <TableHeaderCell>{t('subDistances')}</TableHeaderCell>
                                <TableHeaderCell className="text-end">{t('manage')}</TableHeaderCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {eventObj.disciplines.every((disc) => disc.distances.length === 0) ? (
                                <EmptyTableRow colSpan={4} />
                            ) : (
                                eventObj.disciplines.flatMap((disc) =>
                                    disc.distances.map((dist) => (
                                        <TableRow key={dist.id}>
                                            <TableCell>
                                                {getOptionLabel(DisciplineEnum.getOptions(t), disc.discipline)}
                                            </TableCell>
                                            <TableCell>{dist.distance}</TableCell>
                                            <TableCell>
                                                {dist.subDistances && dist.subDistances.length > 0 ? (
                                                    <Stack as="ul" className="mb-0 list-unstyled small">
                                                        {dist.subDistances.map((sub) => (
                                                            <Stack as="li" key={sub.id} direction="horizontal">
                                                                <BootstrapIcon name="dash" className="me-1" />
                                                                {sub.subDistance} [m]
                                                            </Stack>
                                                        ))}
                                                    </Stack>
                                                ) : (
                                                    <Stack as="span" className="text-muted">
                                                        -
                                                    </Stack>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-end">
                                                <Button
                                                    variant="profile-outline-primary"
                                                    size="sm"
                                                    onClick={() => openListsModal(dist.id)}
                                                >
                                                    <BootstrapIcon name="list-ul" className="me-1" />
                                                    <Stack as="span" className="visually-hidden">
                                                        {t('eventTypes.eventDisciplineList')}
                                                    </Stack>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )),
                                )
                            )}
                        </TableBody>
                    </Table>
                </Stack>
            </Card.Body>
        </Card>
    );
};
