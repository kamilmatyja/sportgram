import React, { useState } from 'react';
import { Stack, Table, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { TrainingResponse } from '../../api/responses/TrainingResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { type TrainingInteractions } from '../../services/Training/useTrainingInteractions';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import { EnumBadge } from '../Common/EnumBadge';
import { FormErrorAlert } from '../Common/FormFields';
import { IconButton } from '../Common/IconButton';
import { ParticipantsTable } from '../Common/ParticipantsTable';
import { canChangeOwnStatus } from '../Common/statusPermissions';
import { EmptyTableRow, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface UserTrainingsTableProps {
    trainings: TrainingResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    actionLoading: string | null;
    onManageClick: (training: TrainingResponse) => void;
    interactions: TrainingInteractions;
}

export const UserTrainingsTable: React.FC<UserTrainingsTableProps> = ({
    trainings,
    relatedUsers,
    currentUser,
    isMyProfile,
    isAdmin,
    actionLoading,
    onManageClick,
    interactions,
}) => {
    const { t } = useTranslation();
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    return (
        <Stack className="table-responsive-custom">
            <FormErrorAlert error={interactions.actionError} />
            <Table bordered hover className="align-middle mb-0 shadow-sm">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('title')}</TableHeaderCell>
                        <TableHeaderCell>{t('location')}</TableHeaderCell>
                        <TableHeaderCell>{t('startedAt')}</TableHeaderCell>
                        <TableHeaderCell>{t('endedAt')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell>{t('details')}</TableHeaderCell>
                        <TableHeaderCell className="text-end" />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {trainings.length === 0 ? (
                        <EmptyTableRow colSpan={7} />
                    ) : (
                        trainings.map((tr) => (
                            <React.Fragment key={tr.id}>
                                <TableRow>
                                    <TableCell>
                                        <Link to={`/trainings/${tr.link}`} className="text-decoration-none">
                                            {tr.title}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="small">{tr.location}</TableCell>
                                    <TableCell className="small text-muted">{formatDate(tr.startedAt)}</TableCell>
                                    <TableCell className="small text-muted">{formatDate(tr.endedAt)}</TableCell>
                                    <TableCell>
                                        <EnumBadge options={ElementStatusEnum.getOptions(t)} value={tr.status} />
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => setExpandedRow(expandedRow === tr.id ? null : tr.id)}
                                        >
                                            <BootstrapIcon
                                                name={expandedRow === tr.id ? 'chevron-up' : 'chevron-down'}
                                                className="me-1"
                                            />
                                            {t('participants')}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-end">
                                        {(isMyProfile || isAdmin) && (
                                            <IconButton icon="gear" onClick={() => onManageClick(tr)} />
                                        )}
                                    </TableCell>
                                </TableRow>
                                {expandedRow === tr.id && (
                                    <TableRow className="bg-light">
                                        <TableCell colSpan={7} className="p-3">
                                            <Card className="border-profile-primary shadow-sm">
                                                <Card.Body>
                                                    <Card.Title as="h6" className="text-profile-primary mb-3 fw-bold">
                                                        {t('participants')} ({tr.participants?.length || 0})
                                                    </Card.Title>
                                                    <ParticipantsTable
                                                        compact
                                                        participants={tr.participants || []}
                                                        relatedUsers={relatedUsers}
                                                        canManage={canChangeOwnStatus(currentUser)}
                                                        actionLoading={actionLoading}
                                                        onUpdateStatus={interactions.handleParticipantStatusSubmit}
                                                    />
                                                </Card.Body>
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
