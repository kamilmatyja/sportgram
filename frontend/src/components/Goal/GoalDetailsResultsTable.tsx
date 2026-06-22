import React from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from '../../context/TranslationContext';
import {GoalParticipantResponse} from '../../api/responses/GoalParticipantResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {SaveStatusEnum} from '../../enums/SaveStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Html';
import {Table, Stack, Button, Badge} from 'react-bootstrap';

interface GoalDetailsResultsTableProps {
    participants: GoalParticipantResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    actionLoading: string | null;
    onUpdateStatus: (resultId: string, status: number) => void;
}

export const GoalDetailsResultsTable: React.FC<GoalDetailsResultsTableProps> = ({
                                                                                    participants,
                                                                                    relatedUsers,
                                                                                    currentUser,
                                                                                    actionLoading,
                                                                                    onUpdateStatus
                                                                                }) => {
    const {t} = useTranslation();

    const allResults = participants.flatMap(p => p.results.map(r => ({
        ...r,
        userId: p.userId
    })));

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('user')}</TableHeaderCell>
                        <TableHeaderCell>{t('distance')} [m]</TableHeaderCell>
                        <TableHeaderCell>{t('timeSeconds')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
                        <TableHeaderCell className="text-end">{t('manage')}</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {allResults.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted">{t('noRecords')}</TableCell>
                        </TableRow>
                    ) : allResults.map(r => {
                        const u = relatedUsers[r.userId];
                        const isOwnerOfRecord = currentUser?.id === r.userId;

                        return (
                            <TableRow key={r.id}>
                                <TableCell>
                                    {u ? (
                                        <Link to={`/users/${u.link}`} className="text-decoration-none">
                                            {u.firstName} {u.lastName}
                                        </Link>
                                    ) : r.userId}
                                </TableCell>
                                <TableCell>{r.distance}</TableCell>
                                <TableCell>{r.time}</TableCell>
                                <TableCell>
                                    <Badge bg="light" text="dark" className="border profile-theme-border">
                                        {SaveStatusEnum.getOptions(t).find(opt => opt.value === r.status)?.label || r.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{formatDate(r.createdAt)}</TableCell>
                                <TableCell className="text-end">
                                    <Stack direction="horizontal" className="justify-content-end gap-1 flex-wrap">
                                        {isOwnerOfRecord && SaveStatusEnum.getOptions(t)
                                            .filter(opt => opt.value !== r.status && opt.value !== SaveStatusEnum.PENDING)
                                            .map(opt => (
                                                <Button
                                                    key={opt.value}
                                                    variant="profile-outline-primary"
                                                    size="sm"
                                                    className="btn-xs py-0 px-2"
                                                    disabled={actionLoading === r.id}
                                                    onClick={() => onUpdateStatus(r.id, opt.value)}
                                                >
                                                    {opt.label}
                                                </Button>
                                            ))}
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </Stack>
    );
};