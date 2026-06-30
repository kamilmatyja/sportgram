import React, { useState } from 'react';
import { Table, Stack, Button, Badge, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { GoalParticipantsTable } from './GoalParticipantsTable';
import { GoalResponse } from '../../api/responses/GoalResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { GoalStatusEnum } from '../../enums/GoalStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface UserGoalsTableProps {
    goals: GoalResponse[];
    relatedUsers: Record<string, UserResponse>;
    isMyProfile: boolean;
    isAdmin: boolean;
    actionLoading: string | null;
    onManageClick: (goal: GoalResponse) => void;
    interactions: any;
}

export const UserGoalsTable: React.FC<UserGoalsTableProps> = ({
    goals,
    relatedUsers,
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
                        <TableHeaderCell>{t('discipline')}</TableHeaderCell>
                        <TableHeaderCell>{t('distance')} [m]</TableHeaderCell>
                        <TableHeaderCell>{t('time')} [s]</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell>{t('startedAt')}</TableHeaderCell>
                        <TableHeaderCell>{t('endedAt')}</TableHeaderCell>
                        <TableHeaderCell>{t('details')}</TableHeaderCell>
                        <TableHeaderCell className="text-end" />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {goals.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted">
                                {t('noRecords')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        goals.map((goal) => (
                            <React.Fragment key={goal.id}>
                                <TableRow>
                                    <TableCell>
                                        <Link to={`/goals/${goal.link}`} className="text-decoration-none">
                                            {goal.text}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="small">
                                        {DisciplineEnum.getOptions(t).find((opt) => opt.value === goal.discipline)
                                            ?.label || goal.discipline}
                                    </TableCell>
                                    <TableCell>{goal.distance}</TableCell>
                                    <TableCell>{goal.time || '-'}</TableCell>
                                    <TableCell>
                                        <Badge bg="light" text="dark" className="border profile-theme-border">
                                            {GoalStatusEnum.getOptions(t).find((opt) => opt.value === goal.status)
                                                ?.label || goal.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="small text-muted">{formatDate(goal.startedAt)}</TableCell>
                                    <TableCell className="small text-muted">{formatDate(goal.endedAt)}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => setExpandedRow(expandedRow === goal.id ? null : goal.id)}
                                        >
                                            <BootstrapIcon
                                                name={expandedRow === goal.id ? 'chevron-up' : 'chevron-down'}
                                                className="me-1"
                                            />
                                            {t('participants')}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-end">
                                        {(isMyProfile || isAdmin) && (
                                            <Button
                                                variant="profile-outline-primary"
                                                size="sm"
                                                onClick={() => onManageClick(goal)}
                                                className="rounded-circle shadow-sm"
                                            >
                                                <BootstrapIcon name="gear" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                                {expandedRow === goal.id && (
                                    <TableRow className="bg-light">
                                        <TableCell colSpan={9} className="p-3">
                                            <Card className="border-profile-primary shadow-sm">
                                                <Card.Body>
                                                    <Card.Title as="h6" className="text-profile-primary mb-3 fw-bold">
                                                        {t('participants')} ({goal.participants?.length || 0})
                                                    </Card.Title>
                                                    <GoalParticipantsTable
                                                        participants={goal.participants || []}
                                                        relatedUsers={relatedUsers}
                                                        canManage={isMyProfile || isAdmin}
                                                        actionLoading={actionLoading}
                                                        onUpdateParticipantStatus={
                                                            interactions.handleParticipantStatusSubmit
                                                        }
                                                        onUpdateResultStatus={interactions.handleResultStatusSubmit}
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
