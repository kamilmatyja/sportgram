import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from '../../context/TranslationContext';
import {TrainingResponse} from '../../api/responses/TrainingResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import {TrainingParticipantsTable} from './TrainingParticipantsTable';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Table';
import {Stack, Table, Badge, Button, Card} from 'react-bootstrap';
import BootstrapIcon from '../Common/BootstrapIcon';

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
                        <TableHeaderCell>{t('location')}</TableHeaderCell>
                        <TableHeaderCell>{t('startedAt')}</TableHeaderCell>
                        <TableHeaderCell>{t('endedAt')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell>{t('details')}</TableHeaderCell>
                        <TableHeaderCell />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {trainings.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted">{t('noRecords')}</TableCell>
                        </TableRow>
                    ) : trainings.map(tr => (
                        <React.Fragment key={tr.id}>
                            <TableRow>
                                <TableCell>
                                    <Link to={`/trainings/${tr.link}`} className="btn btn-link p-0 text-decoration-none">
                                        {tr.title}
                                    </Link>
                                </TableCell>
                                <TableCell>{tr.location}</TableCell>
                                <TableCell>{formatDate(tr.startedAt)}</TableCell>
                                <TableCell>{formatDate(tr.endedAt)}</TableCell>
                                <TableCell>
                                    <Badge bg="light" text="dark" className="border profile-theme-border">
                                        {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(tr.status))?.label || tr.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Button variant="outline-secondary" size="sm" onClick={() => toggleRow(tr.id)}>
                                        <BootstrapIcon name={expandedRow === tr.id ? 'chevron-up' : 'chevron-down'} /> {t('participants')}
                                    </Button>
                                </TableCell>
                                <TableCell className="text-end">
                                    {(isMyProfile || isAdmin || tr.participants?.some(p => p.userId === currentUser?.id)) && (
                                        <Button variant="profile-outline-primary" size="sm" title={t('manage')}
                                                onClick={() => onManageClick(tr)}>
                                            <BootstrapIcon name="gear" aria-hidden="true" />
                                            <Stack as="span" className="visually-hidden">{t('manage')}</Stack>
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                            {expandedRow === tr.id && (
                                <TableRow className="bg-light">
                                    <TableCell colSpan={7} className="p-3">
                                        <Card className="border rounded border-profile-primary bg-white p-3">
                                            <Card.Title as="h6" className="mb-3 text-profile-primary">{t('participants')} ({tr.participants?.length || 0})</Card.Title>
                                            <TrainingParticipantsTable
                                                participants={tr.participants || []}
                                                relatedUsers={relatedUsers}
                                                currentUser={currentUser}
                                                isMyProfile={isMyProfile}
                                                isAdmin={isAdmin}
                                                actionLoading={actionLoading}
                                                onUpdateStatus={interactions.handleParticipantStatusSubmit}
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