import React from 'react';
import { Stack, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { NotificationResponse } from '../../api/responses/NotificationResponse';
import { useTranslation } from '../../context/TranslationContext';
import { NotificationStatusEnum } from '../../enums/NotificationStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import { EnumBadge } from '../Common/EnumBadge';
import { IconButton } from '../Common/IconButton';
import { EmptyTableRow, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

const isInternalLink = (link: string | null | undefined): link is string =>
    !!link && link.startsWith('/') && !link.startsWith('//') && !link.startsWith('/\\');

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
                        <EmptyTableRow colSpan={4} />
                    ) : (
                        notifications.map((notif) => (
                            <TableRow key={notif.id}>
                                <TableCell>
                                    {isInternalLink(notif.link) ? (
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
                                    <EnumBadge options={NotificationStatusEnum.getOptions(t)} value={notif.status} />
                                </TableCell>
                                <TableCell className="small text-muted">{formatDate(notif.createdAt)}</TableCell>
                                <TableCell className="text-end">
                                    {isMyProfile && <IconButton icon="gear" onClick={() => onManageClick(notif)} />}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </Stack>
    );
};
