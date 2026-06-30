import React from 'react';
import { Stack, Table, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { NotificationResponse } from '../../api/responses/NotificationResponse';
import { useTranslation } from '../../context/TranslationContext';
import { NotificationStatusEnum } from '../../enums/NotificationStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface UserNotificationsTableProps {
    notifications: NotificationResponse[];
    isMyProfile: boolean;
    onManageClick: (notification: NotificationResponse) => void;
}

export const UserNotificationsTable: React.FC<UserNotificationsTableProps> = ({
    notifications,
    isMyProfile,
    onManageClick,
}) => {
    const { t } = useTranslation();

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0 shadow-sm">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('text')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
                        <TableHeaderCell className="text-end">{t('manage')}</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {notifications.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted">
                                {t('noRecords')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        notifications.map((notif) => (
                            <TableRow key={notif.id}>
                                <TableCell>
                                    {notif.link ? (
                                        <Link to={notif.link} className="text-decoration-none">
                                            {notif.text}
                                        </Link>
                                    ) : (
                                        <Stack as="span" className="text-muted">
                                            {notif.text}
                                        </Stack>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge bg="light" text="dark" className="border profile-theme-border">
                                        {NotificationStatusEnum.getOptions(t).find(
                                            (opt) => String(opt.value) === String(notif.status),
                                        )?.label || notif.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="small text-muted">{formatDate(notif.createdAt)}</TableCell>
                                <TableCell className="text-end">
                                    {isMyProfile && (
                                        <Button
                                            variant="profile-outline-primary"
                                            size="sm"
                                            className="rounded-circle shadow-sm"
                                            onClick={() => onManageClick(notif)}
                                        >
                                            <BootstrapIcon name="gear" />
                                        </Button>
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
