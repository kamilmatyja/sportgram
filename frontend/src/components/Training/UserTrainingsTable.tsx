import React, { useState } from 'react';
import { Stack, Table, Badge, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { TrainingParticipantsTable } from './TrainingParticipantsTable';
import { TrainingResponse } from '../../api/responses/TrainingResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface UserTrainingsTableProps {
    trainings: TrainingResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    actionLoading: string | null;
    onManageClick: (training: TrainingResponse) => void;
    interactions: any;
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
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted">
                                {t('noRecords')}
                            </TableCell>
                        </TableRow>
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
                                        <Badge bg="light" text="dark" className="border profile-theme-border">
                                            {ElementStatusEnum.getOptions(t).find((o) => o.value === tr.status)
                                                ?.label || tr.status}
                                        </Badge>
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
                                        {(isMyProfile ||
                                            isAdmin ||
                                            tr.participants?.some((p) => p.userId === currentUser?.id)) && (
                                            <Button
                                                variant="profile-outline-primary"
                                                size="sm"
                                                onClick={() => onManageClick(tr)}
                                                className="rounded-circle shadow-sm"
                                            >
                                                <BootstrapIcon name="gear" />
                                            </Button>
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
                                                    <TrainingParticipantsTable
                                                        participants={tr.participants || []}
                                                        relatedUsers={relatedUsers}
                                                        currentUser={currentUser}
                                                        isMyProfile={isMyProfile}
                                                        isAdmin={isAdmin}
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
