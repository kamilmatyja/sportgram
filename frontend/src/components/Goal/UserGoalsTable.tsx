import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from '../../context/TranslationContext';
import {GoalResponse} from '../../api/responses/GoalResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {DisciplineEnum} from '../../enums/DisciplineEnum';
import {GoalStatusEnum} from '../../enums/GoalStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import {GoalParticipantsTable} from './GoalParticipantsTable';
import BootstrapIcon from '../Common/BootstrapIcon';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Html';
import {Table, Stack, Button, Badge, Card} from 'react-bootstrap';

interface UserGoalsTableProps {
    goals: GoalResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    actionLoading: string | null;
    onManageClick: (goal: GoalResponse) => void;
    interactions: any;
}

export const UserGoalsTable: React.FC<UserGoalsTableProps> = ({
                                                                  goals,
                                                                  relatedUsers,
                                                                  currentUser,
                                                                  isMyProfile,
                                                                  isAdmin,
                                                                  actionLoading,
                                                                  onManageClick,
                                                                  interactions
                                                              }) => {
    const {t} = useTranslation();
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const toggleRow = (id: string) => {
        setExpandedRow(prev => prev === id ? null : id);
    };

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0">
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
                        <TableHeaderCell />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {goals.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted">{t('noRecords')}</TableCell>
                        </TableRow>
                    ) : goals.map(goal => (
                        <React.Fragment key={goal.id}>
                            <TableRow>
                                <TableCell>
                                    <Link to={`/goals/${goal.link}`} className="btn btn-link p-0 text-decoration-none">
                                        {goal.text}
                                    </Link>
                                </TableCell>
                                <TableCell>{DisciplineEnum.getOptions(t).find(opt => String(opt.value) === String(goal.discipline))?.label || goal.discipline}</TableCell>
                                <TableCell>{goal.distance}</TableCell>
                                <TableCell>{goal.time ? goal.time : '-'}</TableCell>
                                <TableCell>
                                    <Badge bg="light" text="dark" className="border profile-theme-border">
                                        {GoalStatusEnum.getOptions(t).find(opt => String(opt.value) === String(goal.status))?.label || goal.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{formatDate(goal.startedAt)}</TableCell>
                                <TableCell>{formatDate(goal.endedAt)}</TableCell>
                                <TableCell>
                                    <Button variant="outline-secondary" size="sm" onClick={() => toggleRow(goal.id)}>
                                        <BootstrapIcon name={expandedRow === goal.id ? 'chevron-up' : 'chevron-down'} /> {t('participants')}
                                    </Button>
                                </TableCell>
                                <TableCell className="text-end">
                                    <Stack direction="horizontal" className="justify-content-end gap-2 flex-wrap">
                                        {(isMyProfile || isAdmin) && (
                                            <Button variant="profile-outline-primary" size="sm" title={t('manage')} onClick={() => onManageClick(goal)}>
                                                <BootstrapIcon name="gear" aria-hidden="true" />
                                                <Stack as="span" className="visually-hidden">{t('manage')}</Stack>
                                            </Button>
                                        )}
                                    </Stack>
                                </TableCell>
                            </TableRow>
                            {expandedRow === goal.id && (
                                <TableRow className="bg-light">
                                    <TableCell colSpan={9} className="p-3">
                                        <Card className="border rounded border-profile-primary bg-white p-3">
                                            <Card.Title as="h6" className="mb-3 text-profile-primary">{t('participants')} ({goal.participants?.length || 0})</Card.Title>
                                            <GoalParticipantsTable
                                                participants={goal.participants || []}
                                                relatedUsers={relatedUsers}
                                                currentUser={currentUser}
                                                actionLoading={actionLoading}
                                                onUpdateParticipantStatus={interactions.handleParticipantStatusSubmit}
                                                onUpdateResultStatus={interactions.handleResultStatusSubmit}
                                            />
                                        </Card>
                                    </TableCell>
                                </TableRow>
                            )}
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>
        </Stack>
    );
};