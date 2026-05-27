import React, {useState} from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {FeedCommentResponse} from '../../api/responses/FeedCommentResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {formatDate} from '../../utils/dateFormat';

interface FeedCommentsTableProps {
    feedId: string;
    comments: FeedCommentResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    isAdmin: boolean;
    isFeedLoading: boolean;
    onDeleteComment: (feedId: string, commentId: string) => void;
    onUpdateComment: (feedId: string, commentId: string, text: string) => void;
    onChangeStatus: (commentId: string, status: number) => void;
}

export const FeedCommentsTable: React.FC<FeedCommentsTableProps> = ({
                                                                        feedId,
                                                                        comments,
                                                                        relatedUsers,
                                                                        currentUser,
                                                                        isAdmin,
                                                                        isFeedLoading,
                                                                        onDeleteComment,
                                                                        onUpdateComment,
                                                                        onChangeStatus
                                                                    }) => {
    const {t} = useTranslation();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    if (!comments || comments.length === 0) {
        return <div className="text-muted small p-2">{t('noRecords')}</div>;
    }

    const startEdit = (id: string, text: string) => {
        setEditingId(id);
        setEditText(text);
    };

    const saveEdit = (id: string) => {
        onUpdateComment(feedId, id, editText);
        setEditingId(null);
    };

    return (
        <table className="table table-sm table-borderless align-middle mb-0">
            <thead className="table-light">
            <tr>
                <th>{t('user')}</th>
                <th>{t('text')}</th>
                <th>{t('status')}</th>
                <th>{t('createdAt')}</th>
                <th className="text-end">{t('manage')}</th>
            </tr>
            </thead>
            <tbody>
            {comments.map(c => {
                const author = relatedUsers[c.userId];
                const isOwner = currentUser?.id === c.userId;
                const canChangeStatus = isOwner || isAdmin;

                return (
                    <tr key={c.id}>
                        <td>
                            {author ? (
                                <a href={`/users/${author.link}`}
                                   className="text-decoration-none">{author.firstName} {author.lastName}</a>
                            ) : c.userId}
                        </td>
                        <td>
                            {editingId === c.id ? (
                                <input type="text" className="form-control form-control-sm" value={editText}
                                       onChange={e => setEditText(e.target.value)}/>
                            ) : c.text}
                        </td>
                        <td>
                                <span className="badge bg-light text-dark border profile-theme-border">
                                    {ElementStatusEnum.getOptions(t).find(o => o.value === c.status)?.label || c.status}
                                </span>
                        </td>
                        <td>{formatDate(c.createdAt)}</td>
                        <td className="text-end">
                            <div className="d-flex justify-content-end gap-1 flex-wrap">
                                {isOwner && editingId !== c.id && (
                                    <button className="btn btn-xs btn-outline-secondary py-0" disabled={isFeedLoading}
                                            onClick={() => startEdit(c.id, c.text)}><i className="bi bi-pencil"></i>
                                    </button>
                                )}
                                {isOwner && editingId === c.id && (
                                    <>
                                        <button className="btn btn-xs btn-success py-0" disabled={isFeedLoading}
                                                onClick={() => saveEdit(c.id)}><i className="bi bi-check"></i></button>
                                        <button className="btn btn-xs btn-danger py-0" disabled={isFeedLoading}
                                                onClick={() => setEditingId(null)}><i className="bi bi-x"></i></button>
                                    </>
                                )}
                                {isOwner && (
                                    <button className="btn btn-xs btn-outline-danger py-0" disabled={isFeedLoading}
                                            onClick={() => onDeleteComment(feedId, c.id)}><i
                                        className="bi bi-trash"></i></button>
                                )}
                                {canChangeStatus && ElementStatusEnum.getOptions(t)
                                    .filter(opt => opt.value !== c.status)
                                    .filter(opt => opt.value !== ElementStatusEnum.REJECTED || isAdmin)
                                    .map(opt => (
                                        <button key={opt.value} className="btn btn-xs btn-profile-outline-primary py-0"
                                                disabled={isFeedLoading}
                                                onClick={() => onChangeStatus(c.id, opt.value)}>
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