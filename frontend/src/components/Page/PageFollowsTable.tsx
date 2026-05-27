import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { PageFollowResponse } from '../../api/responses/PageFollowResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { PageFollowStatusEnum } from '../../enums/PageFollowStatusEnum';
import { formatDate } from '../../utils/dateFormat';

interface PageFollowsTableProps {
    follows: PageFollowResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    actionLoading: string | null;
    onUpdateStatus: (followId: string, status: number) => void;
}

export const PageFollowsTable: React.FC<PageFollowsTableProps> = ({
                                                                      follows, relatedUsers, currentUser, isMyProfile, isAdmin, actionLoading, onUpdateStatus
                                                                  }) => {
    const { t } = useTranslation();

    if (!follows || follows.length === 0) {
        return <div className="text-muted small p-2">{t('noRecords')}</div>;
    }

    return (
        <div className="table-responsive">
            <table className="table table-sm table-borderless align-middle mb-0">
                <thead className="table-light">
                <tr>
                    <th>{t('user')}</th>
                    <th>{t('status')}</th>
                    <th>{t('createdAt')}</th>
                    <th className="text-end">{t('manage')}</th>
                </tr>
                </thead>
                <tbody>
                {follows.map(f => {
                    const u = relatedUsers[f.userId];
                    const isOwner = currentUser?.id === f.userId;
                    const canManage = isMyProfile || isAdmin || isOwner;

                    return (
                        <tr key={f.id}>
                            <td>
                                {u ? (
                                    <a href={`/users/${u.link}`} className="text-decoration-none">
                                        {u.firstName} {u.lastName}
                                    </a>
                                ) : f.userId}
                            </td>
                            <td>
                                <span className="badge bg-light text-dark border profile-theme-border">
                                    {PageFollowStatusEnum.getOptions(t).find(opt => opt.value === f.status)?.label || f.status}
                                </span>
                            </td>
                            <td>{formatDate(f.createdAt)}</td>
                            <td className="text-end">
                                {canManage && PageFollowStatusEnum.getOptions(t)
                                    .filter(opt => opt.value !== f.status && opt.value !== PageFollowStatusEnum.PENDING)
                                    .map(opt => (
                                        <button
                                            key={opt.value}
                                            className="btn btn-xs btn-profile-outline-primary py-0 px-2 ms-1"
                                            disabled={actionLoading === f.id}
                                            onClick={() => onUpdateStatus(f.id, opt.value)}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};