import React, {useState} from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {FeedReactionResponse} from '../../api/responses/FeedReactionResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {FeedReactionEnum} from '../../enums/FeedReactionEnum';
import {formatDate} from '../../utils/dateFormat';

interface FeedReactionsTableProps {
    reactions: FeedReactionResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    isAdmin: boolean;
    isFeedLoading: boolean;
    onDeleteReaction: (reactionId: string) => void;
    onUpdateReaction: (reactionId: string, type: number) => void;
    onChangeStatus: (reactionId: string, status: number) => void;
}

export const FeedReactionsTable: React.FC<FeedReactionsTableProps> = ({
                                                                          reactions,
                                                                          relatedUsers,
                                                                          currentUser,
                                                                          isAdmin,
                                                                          isFeedLoading,
                                                                          onDeleteReaction,
                                                                          onUpdateReaction,
                                                                          onChangeStatus
                                                                      }) => {
    const {t} = useTranslation();
    const [editingId, setEditingId] = useState<string | null>(null);

    if (!reactions || reactions.length === 0) {
        return <div className="text-muted small p-2">{t('noRecords')}</div>;
    }

    return (
        <table className="table table-sm table-borderless align-middle mb-0">
            <thead className="table-light">
            <tr>
                <th>{t('user')}</th>
                <th>{t('reaction')}</th>
                <th>{t('status')}</th>
                <th>{t('createdAt')}</th>
                <th className="text-end">{t('manage')}</th>
            </tr>
            </thead>
            <tbody>
            {reactions.map(r => {
                const author = relatedUsers[r.userId];
                const isOwner = currentUser?.id === r.userId;
                const canChangeStatus = isOwner || isAdmin;

                return (
                    <tr key={r.id}>
                        <td>
                            {author ? (
                                <a href={`/users/${author.link}`}
                                   className="text-decoration-none">{author.firstName} {author.lastName}</a>
                            ) : r.userId}
                        </td>
                        <td>
                            {editingId === r.id ? (
                                <select className="form-select form-select-sm" defaultValue={r.reaction}
                                        onChange={(e) => {
                                            onUpdateReaction(r.id, parseInt(e.target.value));
                                            setEditingId(null);
                                        }}>
                                    {FeedReactionEnum.getOptions(t).map(o => <option key={o.value}
                                                                                     value={o.value}>{o.label}</option>)}
                                </select>
                            ) : (
                                FeedReactionEnum.getOptions(t).find(o => o.value === r.reaction)?.label || r.reaction
                            )}
                        </td>
                        <td>
                            <span className="badge bg-light text-dark border profile-theme-border">
                                {ElementStatusEnum.getOptions(t).find(o => o.value === r.status)?.label || r.status}
                            </span>
                        </td>
                        <td>{formatDate(r.createdAt)}</td>
                        <td className="text-end">
                            <div className="d-flex justify-content-end gap-1 flex-wrap">
                                {isOwner && editingId !== r.id && (
                                    <button className="btn btn-xs btn-outline-secondary py-0" disabled={isFeedLoading}
                                            onClick={() => setEditingId(r.id)}><i className="bi bi-pencil"></i></button>
                                )}
                                {isOwner && editingId === r.id && (
                                    <button className="btn btn-xs btn-danger py-0" disabled={isFeedLoading}
                                            onClick={() => setEditingId(null)}><i className="bi bi-x"></i></button>
                                )}
                                {isOwner && (
                                    <button className="btn btn-xs btn-outline-danger py-0" disabled={isFeedLoading}
                                            onClick={() => onDeleteReaction(r.id)}><i className="bi bi-trash"></i>
                                    </button>
                                )}
                                {canChangeStatus && ElementStatusEnum.getOptions(t)
                                    .filter(opt => opt.value !== r.status)
                                    .filter(opt => opt.value !== ElementStatusEnum.REJECTED || isAdmin)
                                    .map(opt => (
                                        <button key={opt.value} className="btn btn-xs btn-profile-outline-primary py-0"
                                                disabled={isFeedLoading}
                                                onClick={() => onChangeStatus(r.id, opt.value)}>
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
    );
};