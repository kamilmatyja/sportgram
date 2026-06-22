import React from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from '../../context/TranslationContext';
import {FriendResponse} from '../../api/responses/FriendResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {FriendStatusEnum} from '../../enums/FriendStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Table.tsx';
import {Table, Stack, Button, Badge} from 'react-bootstrap';

interface UserFriendsTableProps {
    friends: FriendResponse[];
    relatedUsers: Record<string, UserResponse>;
    isMyProfile: boolean;
    onManageClick: (friend: FriendResponse) => void;
}

export const UserFriendsTable: React.FC<UserFriendsTableProps> = ({
                                                                      friends, relatedUsers, isMyProfile, onManageClick
                                                                  }) => {
    const {t} = useTranslation();

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('sender')}</TableHeaderCell>
                        <TableHeaderCell>{t('receiver')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
                        <TableHeaderCell />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {friends.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted">{t('noRecords')}</TableCell>
                        </TableRow>
                    ) : friends.map(friend => {
                        const sender = relatedUsers[friend.senderUserId];
                        const receiver = relatedUsers[friend.receiverUserId];

                        return (
                            <TableRow key={friend.id}>
                                <TableCell>
                                    {sender ? (
                                        <Link to={`/users/${sender.link}`} className="btn btn-link p-0 text-decoration-none">
                                            {sender.firstName} {sender.lastName}
                                        </Link>
                                    ) : friend.senderUserId}
                                </TableCell>
                                <TableCell>
                                    {receiver ? (
                                        <Link to={`/users/${receiver.link}`} className="btn btn-link p-0 text-decoration-none">
                                            {receiver.firstName} {receiver.lastName}
                                        </Link>
                                    ) : friend.receiverUserId}
                                </TableCell>
                                <TableCell>
                                    <Badge bg="light" text="dark" className="border profile-theme-border">
                                        {FriendStatusEnum.getOptions(t).find(opt => String(opt.value) === String(friend.status))?.label || friend.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{formatDate(friend.createdAt)}</TableCell>
                                <TableCell className="text-end">
                                    {isMyProfile && (
                                        <Button variant="profile-outline-primary" size="sm" title={t('manage')}
                                                onClick={() => onManageClick(friend)}>
                                            <BootstrapIcon name="gear" aria-hidden="true" />
                                            <Stack as="span" className="visually-hidden">{t('manage')}</Stack>
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </Stack>
    );
};