import React from 'react';
import { Button, Card, Stack } from 'react-bootstrap';

import { ResultEntryForm } from './ResultEntryForm';
import { type EventInteractions } from '../../services/Event/useEventInteractions';
import { type ListResultsState } from '../../services/Event/useListResults';
import { EventDisciplineDistanceListResponse } from '../../api/responses/EventDisciplineDistanceListResponse';
import { EventDisciplineDistanceResultResponse } from '../../api/responses/EventDisciplineDistanceResultResponse';
import { EventDisciplineSubDistanceResponse } from '../../api/responses/EventDisciplineSubDistanceResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import { EnumBadge } from '../Common/EnumBadge';
import { TableCell, TableHeaderCell, TableRow } from '../Common/Table';
import { UserLink } from '../Common/UserLink';

const getResult = (list: EventDisciplineDistanceListResponse): EventDisciplineDistanceResultResponse | null =>
    list.results?.length > 0 ? list.results[0] : null;

export const hasListResult = (list: EventDisciplineDistanceListResponse): boolean => getResult(list) !== null;

interface ListResultToggleProps {
    list: EventDisciplineDistanceListResponse;
    results: ListResultsState;
}

const ListResultToggle: React.FC<ListResultToggleProps> = ({ list, results }) => {
    const { t } = useTranslation();
    const result = getResult(list);

    if (!result && !results.isFormOpen(list.id)) {
        return (
            <Stack as="span" className="text-muted small">
                -
            </Stack>
        );
    }

    return (
        <Button variant="outline-secondary" size="sm" onClick={() => results.toggleRow(list.id)}>
            <BootstrapIcon name={results.isExpanded(list.id) ? 'chevron-up' : 'chevron-down'} />
            {result ? ` ${t('time')}: ${result.time} [s]` : ` ${t('resultFormTitle')}`}
        </Button>
    );
};

export const ListInfoHeaderCells: React.FC = () => {
    const { t } = useTranslation();

    return (
        <>
            <TableHeaderCell>{t('user')}</TableHeaderCell>
            <TableHeaderCell>{t('status')}</TableHeaderCell>
            <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
            <TableHeaderCell>{t('eventTypes.eventDisciplineResult')}</TableHeaderCell>
        </>
    );
};

interface ListInfoCellsProps extends ListResultToggleProps {
    user: UserResponse | undefined;
}

export const ListInfoCells: React.FC<ListInfoCellsProps> = ({ list, user, results }) => {
    const { t } = useTranslation();

    return (
        <>
            <TableCell>
                <UserLink user={user} />
            </TableCell>
            <TableCell>
                <EnumBadge options={SaveStatusEnum.getOptions(t)} value={list.status} />
            </TableCell>
            <TableCell className="small text-muted">{formatDate(list.createdAt)}</TableCell>
            <TableCell>
                <ListResultToggle list={list} results={results} />
            </TableCell>
        </>
    );
};

interface ListResultDetailsRowProps {
    list: EventDisciplineDistanceListResponse;
    results: ListResultsState;
    interactions: EventInteractions;
    subDistances: EventDisciplineSubDistanceResponse[];
    canManage: boolean;
    colSpan: number;
}

export const ListResultDetailsRow: React.FC<ListResultDetailsRowProps> = ({
    list,
    results,
    interactions,
    subDistances,
    canManage,
    colSpan,
}) => {
    const { t } = useTranslation();
    const result = getResult(list);
    const isFormOpen = results.isFormOpen(list.id);

    if (!results.isExpanded(list.id) || (!result && !isFormOpen)) return null;

    const getSubDistance = (subDistanceId: string) =>
        subDistances.find((sd) => sd.id === subDistanceId)?.subDistance || '?';

    return (
        <TableRow className="bg-light">
            <TableCell colSpan={colSpan} className="p-3">
                {isFormOpen ? (
                    <ResultEntryForm
                        formData={results.formData}
                        onChange={results.setFormData}
                        subDistances={subDistances}
                        fieldErrors={interactions.resultFieldErrors}
                        globalError={interactions.resultGlobalError}
                        saving={interactions.actionLoading !== null}
                        onCancel={results.closeForm}
                        onSave={results.saveResult}
                    />
                ) : (
                    result && (
                        <Card className="border-profile-primary">
                            <Card.Body>
                                <Stack
                                    direction="horizontal"
                                    className="justify-content-between align-items-center mb-2"
                                >
                                    <Stack as="strong" className="text-profile-primary small">
                                        {t('eventTypes.eventDisciplineResult')}
                                    </Stack>
                                    {canManage && (
                                        <Stack direction="horizontal" gap={1}>
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                className="py-0 px-2"
                                                onClick={() => results.openEditForm(list, result.id)}
                                                aria-label={t('edit')}
                                            >
                                                <BootstrapIcon name="pencil" />
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                className="py-0 px-2"
                                                onClick={() => results.deleteResult(result.id)}
                                                disabled={interactions.actionLoading === 'delete_result'}
                                                aria-label={t('delete')}
                                            >
                                                <BootstrapIcon name="trash" />
                                            </Button>
                                        </Stack>
                                    )}
                                </Stack>
                                <Stack direction="horizontal" gap={2} className="small">
                                    <Stack as="span" className="fw-bold">
                                        {t('finalTimeSeconds')}:
                                    </Stack>
                                    <Stack as="span">{result.time} [s]</Stack>
                                </Stack>
                                {result.subResults?.length > 0 && (
                                    <Stack className="mt-2" gap={1}>
                                        <Stack as="strong" className="small text-muted">
                                            {t('subDistances')}:
                                        </Stack>
                                        {result.subResults.map((sr) => (
                                            <Stack key={sr.id} as="small" className="text-muted ms-2">
                                                • {t('forDistance')} {getSubDistance(sr.eventDisciplineSubDistanceId)}{' '}
                                                [m] - {sr.time} [s]
                                            </Stack>
                                        ))}
                                    </Stack>
                                )}
                            </Card.Body>
                        </Card>
                    )
                )}
            </TableCell>
        </TableRow>
    );
};
