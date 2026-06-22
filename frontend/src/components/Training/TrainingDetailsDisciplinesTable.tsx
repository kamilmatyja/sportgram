import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {TrainingDisciplineResponse} from '../../api/responses/TrainingDisciplineResponse';
import {DisciplineEnum} from '../../enums/DisciplineEnum';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Table';
import {Table, Stack} from 'react-bootstrap';
import BootstrapIcon from '../Common/BootstrapIcon';

interface TrainingDetailsDisciplinesTableProps {
    disciplines: TrainingDisciplineResponse[];
}

export const TrainingDetailsDisciplinesTable: React.FC<TrainingDetailsDisciplinesTableProps> = ({disciplines}) => {
    const {t} = useTranslation();

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
                            <TableCell colSpan={4} className="text-center text-muted">{t('noRecords')}</TableCell>
                        </TableRow>
                    ) : disciplines.flatMap(disc =>
                        disc.distances.map(dist => (
                            <TableRow key={dist.id}>
                                <TableCell>{DisciplineEnum.getOptions(t).find(opt => String(opt.value) === String(disc.discipline))?.label || disc.discipline}</TableCell>
                                <TableCell>{dist.distance}</TableCell>
                                <TableCell>{dist.time}</TableCell>
                                <TableCell>
                                    {dist.subDistances && dist.subDistances.length > 0 ? (
                                        <Stack as="ul" className="mb-0 list-unstyled small">
                                            {dist.subDistances.map(sub => (
                                                <Stack as="li" key={sub.id}>
                                                    <BootstrapIcon name="dash" className="me-1" />
                                                    {sub.subDistance} [m] - {sub.time} [s]
                                                </Stack>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Stack as="span" className="text-muted">-</Stack>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </Stack>
    );
};