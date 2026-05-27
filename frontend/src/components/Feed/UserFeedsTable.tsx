import React, { useState } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { FeedResponse } from '../../api/responses/FeedResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import { FeedCommentsTable } from './FeedCommentsTable';
import { FeedReactionsTable } from './FeedReactionsTable';

interface UserFeedsTableProps {
    feeds: FeedResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    actionLoading: string | null;
    onManageClick: (feed: FeedResponse) => void;
    interactions: any;
}

export const UserFeedsTable: React.FC<UserFeedsTableProps> = ({
                                                                  feeds, relatedUsers, currentUser, isMyProfile, isAdmin, actionLoading, onManageClick, interactions
                                                              }) => {
    const { t } = useTranslation();
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'comments'|'reactions'>('comments');

    const toggleRow = (id: string) => {
        setExpandedRow(prev => prev === id ? null : id);
    };

    const getFeedTypeLabel = (feed: FeedResponse) => {
        if (feed.eventDisciplineList) return t('feedTypes.eventDisciplineList');
        if (feed.eventDisciplineResult) return t('feedTypes.eventDisciplineResult');
        if (feed.goal) return t('feedTypes.goal');
        if (feed.goalParticipantResult) return t('feedTypes.goalParticipantResult');
        if (feed.training) return t('feedTypes.training');
        return t('feedTypes.regular');
    };

    if (feeds.length === 0) {
        return (
            <div className="table-responsive-custom">
                <table className="table table-bordered table-hover align-middle">
                    <tbody><tr><td colSpan={7} className="text-center text-muted">{t('noFeeds')}</td></tr></tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="table-responsive-custom">
            <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                <tr>
                    <th>{t('photo')}</th>
                    <th>{t('type')}</th>
                    <th>{t('text')}</th>
                    <th>{t('status')}</th>
                    <th>{t('createdAt')}</th>
                    <th>{t('details')}</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {feeds.map(feed => (
                    <React.Fragment key={feed.id}>
                        <tr>
                            <td className="text-center feed-photo-cell">
                                {feed.photo ? (
                                    <img src={`data:image/webp;base64,${feed.photo}`} alt="feed" className="rounded img-fluid feed-photo" />
                                ) : <span className="text-muted">-</span>}
                            </td>
                            <td>{getFeedTypeLabel(feed)}</td>
                            <td className="text-truncate">{feed.text}</td>
                            <td>{ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(feed.status))?.label || feed.status}</td>
                            <td>{formatDate(feed.createdAt)}</td>
                            <td>
                                <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleRow(feed.id)}>
                                    {expandedRow === feed.id ? <i className="bi bi-chevron-up"></i> : <i className="bi bi-chevron-down"></i>} {t('comments')} / {t('reactions')}
                                </button>
                            </td>
                            <td className="text-end">
                                {(isMyProfile || isAdmin) && (
                                    <button className="btn btn-sm btn-profile-outline-primary" title={t('manage')} onClick={() => onManageClick(feed)}>
                                        <i className="bi bi-gear"></i>
                                    </button>
                                )}
                            </td>
                        </tr>
                        {expandedRow === feed.id && (
                            <tr className="bg-light">
                                <td colSpan={7} className="p-3">
                                    <div className="border rounded border-profile-primary bg-white overflow-hidden">
                                        <ul className="nav nav-tabs px-3 pt-2 bg-light border-bottom">
                                            <li className="nav-item">
                                                <button className={`nav-link ${activeTab === 'comments' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`} onClick={() => setActiveTab('comments')}>
                                                    {t('comments')} ({feed.comments?.length || 0})
                                                </button>
                                            </li>
                                            <li className="nav-item">
                                                <button className={`nav-link ${activeTab === 'reactions' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`} onClick={() => setActiveTab('reactions')}>
                                                    {t('reactions')} ({feed.reactions?.length || 0})
                                                </button>
                                            </li>
                                        </ul>
                                        <div className="p-3">
                                            {activeTab === 'comments' ? (
                                                <FeedCommentsTable
                                                    feedId={feed.id}
                                                    comments={feed.comments || []}
                                                    relatedUsers={relatedUsers}
                                                    currentUser={currentUser}
                                                    isMyProfile={isMyProfile}
                                                    isAdmin={isAdmin}
                                                    isFeedLoading={actionLoading === feed.id}
                                                    onDeleteComment={interactions.handleDeleteComment}
                                                    onUpdateComment={interactions.handleUpdateTableComment}
                                                    onChangeStatus={interactions.handleCommentStatusSubmit}
                                                />
                                            ) : (
                                                <FeedReactionsTable
                                                    reactions={feed.reactions || []}
                                                    relatedUsers={relatedUsers}
                                                    currentUser={currentUser}
                                                    isMyProfile={isMyProfile}
                                                    isAdmin={isAdmin}
                                                    isFeedLoading={actionLoading === feed.id}
                                                    onDeleteReaction={interactions.handleDeleteReaction}
                                                    onUpdateReaction={interactions.handleUpdateReaction}
                                                    onChangeStatus={interactions.handleReactionStatusSubmit}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                ))}
                </tbody>
            </table>
        </div>
    );
};