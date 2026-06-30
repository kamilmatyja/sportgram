import React from 'react';
import { Table, Stack, Button, Badge, Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { FriendResponse } from '../../api/responses/FriendResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface UserFriendsTableProps {
    friends: FriendResponse[];
    relatedUsers: Record<string, UserResponse>;
    isMyProfile: boolean;
    onManageClick: (friend: FriendResponse) => void;
}

export const UserFriendsTable: React.FC<UserFriendsTableProps> = ({
    friends,
    relatedUsers,
    isMyProfile,
    onManageClick,
}) => {
    const { t } = useTranslation();

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0 shadow-sm">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('sender')}</TableHeaderCell>
                        <TableHeaderCell>{t('receiver')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
                        <TableHeaderCell className="text-end">{t('manage')}</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {friends.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted">
                                {t('noRecords')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        friends.map((friend) => {
                            const sender = relatedUsers[friend.senderUserId];
                            const receiver = relatedUsers[friend.receiverUserId];

                            const renderUserCell = (u: UserResponse | undefined, fallbackId: string) => (
                                <Stack direction="horizontal" gap={2}>
                                    {u?.profilePhoto ? (
                                        <Image
                                            src={`data:image/webp;base64,${u.profilePhoto}`}
                                            roundedCircle
                                            className="feed-avatar-32 object-fit-cover"
                                        />
                                    ) : (
                                        <Stack className="bg-secondary rounded-circle feed-avatar-32" />
                                    )}
                                    {u ? (
                                        <Link to={`/users/${u.link}`} className="text-decoration-none">
                                            {u.firstName} {u.lastName}
                                        </Link>
                                    ) : (
                                        fallbackId
                                    )}
                                </Stack>
                            );

                            return (
                                <TableRow key={friend.id}>
                                    <TableCell>{renderUserCell(sender, friend.senderUserId)}</TableCell>
                                    <TableCell>{renderUserCell(receiver, friend.receiverUserId)}</TableCell>
                                    <TableCell>
                                        <Badge bg="light" text="dark" className="border profile-theme-border">
                                            {FriendStatusEnum.getOptions(t).find((opt) => opt.value === friend.status)
                                                ?.label || friend.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="small text-muted">{formatDate(friend.createdAt)}</TableCell>
                                    <TableCell className="text-end">
                                        {isMyProfile && (
                                            <Button
                                                variant="profile-outline-primary"
                                                size="sm"
                                                className="rounded-circle shadow-sm"
                                                onClick={() => onManageClick(friend)}
                                            >
                                                <BootstrapIcon name="gear" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </Stack>
    );
};
