import React from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from '../../context/TranslationContext';
import {NotificationResponse} from '../../api/responses/NotificationResponse';
import {NotificationStatusEnum} from '../../enums/NotificationStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Table.tsx';
import {Stack, Table, Badge, Button} from 'react-bootstrap';

interface UserNotificationsTableProps {
    notifications: NotificationResponse[];
    isMyProfile: boolean;
    onManageClick: (notification: NotificationResponse) => void;
}

export const UserNotificationsTable: React.FC<UserNotificationsTableProps> = ({
                                                                                  notifications,
                                                                                  isMyProfile,
                                                                                  onManageClick
                                                                              }) => {
    const {t} = useTranslation();

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('text')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
                        <TableHeaderCell />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {notifications.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted">{t('noRecords')}</TableCell>
                        </TableRow>
                    ) : notifications.map(notif => (
                        <TableRow key={notif.id} className="text-muted">
                            <TableCell>
                                {notif.link ? (
                                    <Link to={notif.link} className="btn btn-link p-0 text-decoration-none">
                                        {notif.text}
                                    </Link>
                                ) : (
                                    notif.text
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge bg="light" text="dark" className="border profile-theme-border">
                                    {NotificationStatusEnum.getOptions(t).find(opt => String(opt.value) === String(notif.status))?.label || notif.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{formatDate(notif.createdAt)}</TableCell>
                            <TableCell className="text-end">
                                {isMyProfile && (
                                    <Button variant="profile-outline-primary" size="sm" title={t('manage')}
                                            onClick={() => onManageClick(notif)}>
                                        <BootstrapIcon name="gear" aria-hidden="true" />
                                        <Stack as="span" className="visually-hidden">{t('manage')}</Stack>
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Stack>
    );
};