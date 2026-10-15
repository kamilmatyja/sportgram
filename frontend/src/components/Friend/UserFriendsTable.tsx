import React from 'react';
import { Table, Stack } from 'react-bootstrap';

import { FriendResponse } from '../../api/responses/FriendResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import { Base64Image } from '../Common/Base64Image';
import { EnumBadge } from '../Common/EnumBadge';
import { IconButton } from '../Common/IconButton';
import { EmptyTableRow, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';
import { UserLink } from '../Common/UserLink';

const UserCell: React.FC<{ user: UserResponse | undefined }> = ({ user }) => (
    <Stack direction="horizontal" gap={2}>
        <Base64Image
            data={user?.profilePhoto}
            fallback={<Stack className="bg-secondary rounded-circle feed-avatar-32" />}
            roundedCircle
            className="feed-avatar-32 object-fit-cover"
        />
        <UserLink user={user} />
    </Stack>
);

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
                        <EmptyTableRow colSpan={5} />
                    ) : (
                        friends.map((friend) => (
                            <TableRow key={friend.id}>
                                <TableCell>
                                    <UserCell user={relatedUsers[friend.senderUserId]} />
                                </TableCell>
                                <TableCell>
                                    <UserCell user={relatedUsers[friend.receiverUserId]} />
                                </TableCell>
                                <TableCell>
                                    <EnumBadge options={FriendStatusEnum.getOptions(t)} value={friend.status} />
                                </TableCell>
                                <TableCell className="small text-muted">{formatDate(friend.createdAt)}</TableCell>
                                <TableCell className="text-end">
                                    {isMyProfile && <IconButton icon="gear" onClick={() => onManageClick(friend)} />}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </Stack>
    );
};
