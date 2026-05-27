import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../context/TranslationContext';
import { PageFollowResponse } from '../../api/responses/PageFollowResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { PageFollowStatusEnum } from '../../enums/PageFollowStatusEnum';
import { formatDate } from '../../utils/dateFormat';

interface PageDetailsFollowsTableProps {
    follows: PageFollowResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    actionLoading: string | null;
    onUpdateStatus: (followId: string, status: number) => void;
}

export const PageDetailsFollowsTable: React.FC<PageDetailsFollowsTableProps> = ({
                                                                                    follows, relatedUsers, currentUser, actionLoading, onUpdateStatus
                                                                                }) => {
    const { t } = useTranslation();

    if (!follows || follows.length === 0) {
        return (
            <div className="table-responsive-custom">
                <table className="table table-bordered table-hover align-middle mb-0">
                    <tbody><tr><td colSpan={4} className="text-center text-muted">{t('noRecords')}</td></tr></tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="table-responsive-custom">
            <table className="table table-bordered table-hover align-middle mb-0">
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

                    return (
                        <tr key={f.id}>
                            <td>
                                {u ? (
                                    <Link to={`/users/${u.link}`} className="text-decoration-none">
                                        {u.firstName} {u.lastName}
                                    </Link>
                                ) : f.userId}
                            </td>
                            <td>
                                <span className="badge bg-light text-dark border profile-theme-border">
                                    {PageFollowStatusEnum.getOptions(t).find(opt => opt.value === f.status)?.label || f.status}
                                </span>
                            </td>
                            <td>{formatDate(f.createdAt)}</td>
                            <td className="text-end">
                                <div className="d-flex justify-content-end gap-1 flex-wrap">
                                    {isOwner && PageFollowStatusEnum.getOptions(t)
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
                                </div>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};