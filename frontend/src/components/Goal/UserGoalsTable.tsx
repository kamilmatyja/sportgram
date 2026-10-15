import React, { useState } from 'react';
import { Table, Stack, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { GoalParticipantsTable } from './GoalParticipantsTable';
import { GoalResponse } from '../../api/responses/GoalResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { type GoalInteractions } from '../../services/Goal/useGoalInteractions';
import { DisciplineEnum } from '../../enums/DisciplineEnum';
import { GoalStatusEnum } from '../../enums/GoalStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import { getOptionLabel } from '../../utils/options';
import BootstrapIcon from '../Common/BootstrapIcon';
import { EnumBadge } from '../Common/EnumBadge';
import { FormErrorAlert } from '../Common/FormFields';
import { IconButton } from '../Common/IconButton';
import { EmptyTableRow, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface UserGoalsTableProps {
    goals: GoalResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    actionLoading: string | null;
    onManageClick: (goal: GoalResponse) => void;
    interactions: GoalInteractions;
}

export const UserGoalsTable: React.FC<UserGoalsTableProps> = ({
    goals,
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
                        <EmptyTableRow colSpan={9} />
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
                                        {getOptionLabel(DisciplineEnum.getOptions(t), goal.discipline)}
                                    </TableCell>
                                    <TableCell>{goal.distance}</TableCell>
                                    <TableCell>{goal.time || '-'}</TableCell>
                                    <TableCell>
                                        <EnumBadge options={GoalStatusEnum.getOptions(t)} value={goal.status} />
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
                                            <IconButton icon="gear" onClick={() => onManageClick(goal)} />
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
                                                        currentUser={currentUser}
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
