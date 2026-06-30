import React from 'react';
import { Card, Table, Button, Stack } from 'react-bootstrap';

import { EventResponse } from '../../api/responses/EventResponse';
import { useTranslation } from '../../context/TranslationContext';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import BootstrapIcon from '../Common/BootstrapIcon';
import { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface EventDisciplinesTableProps {
    eventObj: EventResponse;
    openListsModal: (distId: string) => void;
}

export const EventDisciplinesTable: React.FC<EventDisciplinesTableProps> = ({ eventObj, openListsModal }) => {
    const { t } = useTranslation();

    return (
        <Card className="shadow-sm mb-4">
            <Card.Body>
                <Card.Title as="h5" className="mb-3 text-profile-primary fw-bold">
                    {t('disciplinesAndDistances')}
                </Card.Title>

                <Stack className="table-responsive-custom">
                    <Table bordered hover className="align-middle mb-0">
                        <TableHead className="table-light">
                            <TableRow>
                                <TableHeaderCell>{t('discipline')}</TableHeaderCell>
                                <TableHeaderCell>{t('distance')} [m]</TableHeaderCell>
                                <TableHeaderCell>{t('subDistances')}</TableHeaderCell>
                                <TableHeaderCell className="text-end">{t('manage')}</TableHeaderCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {eventObj.disciplines.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted">
                                        {t('noRecords')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                eventObj.disciplines.flatMap((disc) =>
                                    disc.distances.map((dist) => (
                                        <TableRow key={dist.id}>
                                            <TableCell>
                                                {DisciplineEnum.getOptions(t).find(
                                                    (opt) => String(opt.value) === String(disc.discipline),
                                                )?.label || disc.discipline}
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
