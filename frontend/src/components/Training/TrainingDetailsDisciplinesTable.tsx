import React from 'react';
import { Table, Stack } from 'react-bootstrap';

import { TrainingDisciplineResponse } from '../../api/responses/TrainingDisciplineResponse';
import { useTranslation } from '../../context/TranslationContext';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import BootstrapIcon from '../Common/BootstrapIcon';
import { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface TrainingDetailsDisciplinesTableProps {
    disciplines: TrainingDisciplineResponse[];
}

export const TrainingDetailsDisciplinesTable: React.FC<TrainingDetailsDisciplinesTableProps> = ({ disciplines }) => {
    const { t } = useTranslation();

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('discipline')}</TableHeaderCell>
                        <TableHeaderCell>{t('distance')} [m]</TableHeaderCell>
                        <TableHeaderCell>{t('timeSeconds')}</TableHeaderCell>
                        <TableHeaderCell>{t('subDistances')}</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {disciplines.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted">
                                {t('noRecords')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        disciplines.flatMap((disc) =>
                            disc.distances.map((dist) => (
                                <TableRow key={dist.id}>
                                    <TableCell>
                                        {DisciplineEnum.getOptions(t).find((opt) => opt.value === disc.discipline)
                                            ?.label || disc.discipline}
                                    </TableCell>
                                    <TableCell>{dist.distance}</TableCell>
                                    <TableCell>{dist.time}</TableCell>
                                    <TableCell>
                                        {dist.subDistances?.length > 0 ? (
                                            <Stack as="ul" className="mb-0 list-unstyled small">
                                                {dist.subDistances.map((sub) => (
                                                    <Stack as="li" key={sub.id} direction="horizontal" gap={1}>
                                                        <BootstrapIcon name="dash" />
                                                        <Stack as="span">
                                                            {sub.subDistance} [m] - {sub.time} [s]
                                                        </Stack>
                                                    </Stack>
                                                ))}
                                            </Stack>
                                        ) : (
                                            <Stack as="span" className="text-muted">
                                                -
                                            </Stack>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )),
                        )
                    )}
                </TableBody>
            </Table>
        </Stack>
    );
};
