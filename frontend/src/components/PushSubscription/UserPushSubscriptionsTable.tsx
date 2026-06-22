import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {PushSubscriptionResponse} from '../../api/responses/PushSubscriptionResponse';
import {PushSubscriptionStatusEnum} from '../../enums/PushSubscriptionStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Table';
import {Stack, Table, Badge, Button} from 'react-bootstrap';
import BootstrapIcon from '../Common/BootstrapIcon';

interface UserPushSubscriptionsTableProps {
    subscriptions: PushSubscriptionResponse[];
    isMyProfile: boolean;
    isAdmin: boolean;
    onManageClick: (subscription: PushSubscriptionResponse) => void;
}

export const UserPushSubscriptionsTable: React.FC<UserPushSubscriptionsTableProps> = ({
                                                                                          subscriptions,
                                                                                          isMyProfile,
                                                                                          isAdmin,
                                                                                          onManageClick
                                                                                      }) => {
    const {t} = useTranslation();

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('browserDevice')}</TableHeaderCell>
                        <TableHeaderCell>{t('endpoint')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
                        <TableHeaderCell />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {subscriptions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted">{t('noRecords')}</TableCell>
                        </TableRow>
                    ) : subscriptions.map(sub => (
                        <TableRow key={sub.id}>
                            <TableCell>{sub.userAgent || '-'}</TableCell>
                            <TableCell>{sub.endpoint}</TableCell>
                            <TableCell>
                                <Badge bg="light" text="dark" className="border profile-theme-border">
                                    {PushSubscriptionStatusEnum.getOptions(t).find(opt => String(opt.value) === String(sub.status))?.label || sub.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{formatDate(sub.createdAt)}</TableCell>
                            <TableCell className="text-end">
                                {(isMyProfile || isAdmin) && (
                                    <Button variant="profile-outline-primary" size="sm" title={t('manage')}
                                            onClick={() => onManageClick(sub)}>
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