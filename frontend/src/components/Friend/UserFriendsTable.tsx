import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { FriendResponse } from '../../api/responses/FriendResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { formatDate } from '../../utils/dateFormat';

interface UserFriendsTableProps {
    friends: FriendResponse[];
    relatedUsers: Record<string, UserResponse>;
    isMyProfile: boolean;
    onManageClick: (friend: FriendResponse) => void;
}

export const UserFriendsTable: React.FC<UserFriendsTableProps> = ({
                                                                      friends, relatedUsers, isMyProfile, onManageClick
                                                                  }) => {
    const { t } = useTranslation();

    if (friends.length === 0) {
        return (
            <div className="table-responsive-custom">
                <table className="table table-bordered table-hover align-middle">
                    <tbody>
                    <tr>
                        <td colSpan={5} className="text-center text-muted">{t('noUsers')}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="table-responsive-custom">
            <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                <tr>
                    <th>{t('sender')}</th>
                    <th>{t('receiver')}</th>
                    <th>{t('status')}</th>
                    <th>{t('createdAt')}</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {friends.map(friend => {
                    const sender = relatedUsers[friend.senderUserId];
                    const receiver = relatedUsers[friend.receiverUserId];

                    return (
                        <tr key={friend.id}>
                            <td>
                                {sender ? (
                                    <a href={`/users/${sender.link}`} className="btn btn-link p-0 text-decoration-none">
                                        {sender.firstName} {sender.lastName}
                                    </a>
                                ) : friend.senderUserId}
                            </td>
                            <td>
                                {receiver ? (
                                    <a href={`/users/${receiver.link}`} className="btn btn-link p-0 text-decoration-none">
                                        {receiver.firstName} {receiver.lastName}
                                    </a>
                                ) : friend.receiverUserId}
                            </td>
                            <td>{FriendStatusEnum.getOptions(t).find(opt => String(opt.value) === String(friend.status))?.label || friend.status}</td>
                            <td>{formatDate(friend.createdAt)}</td>
                            <td className="text-end">
                                {isMyProfile && (
                                    <button className="btn btn-sm btn-profile-outline-primary" title={t('manage')} onClick={() => onManageClick(friend)}>
                                        <i className="bi bi-gear" aria-hidden="true"></i>
                                        <span className="visually-hidden">{t('manage')}</span>
                                    </button>
                                )}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};