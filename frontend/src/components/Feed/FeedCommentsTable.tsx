import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from '../../context/TranslationContext';
import {FeedCommentResponse} from '../../api/responses/FeedCommentResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Table';
import {Table, Stack, Button, Form, Badge} from 'react-bootstrap';

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

    const startEdit = (id: string, text: string) => {
        setEditingId(id);
        setEditText(text);
    };

    const saveEdit = (id: string) => {
        onUpdateComment(feedId, id, editText);
        setEditingId(null);
    };

    return (
        <Table size="sm" borderless hover className="align-middle mb-0">
            <TableHead className="table-light">
                <TableRow>
                    <TableHeaderCell>{t('user')}</TableHeaderCell>
                    <TableHeaderCell>{t('text')}</TableHeaderCell>
                    <TableHeaderCell>{t('status')}</TableHeaderCell>
                    <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
                    <TableHeaderCell className="text-end">{t('manage')}</TableHeaderCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {comments.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted">{t('noRecords')}</TableCell>
                    </TableRow>
                ) : comments.map(c => {
                    const author = relatedUsers[c.userId];
                    const isOwner = currentUser?.id === c.userId;
                    const canChangeStatus = isOwner || isAdmin;

                    return (
                        <TableRow key={c.id}>
                            <TableCell>
                                {author ? (
                                    <Link to={`/users/${author.link}`} className="text-decoration-none">
                                        {author.firstName} {author.lastName}
                                    </Link>
                                ) : c.userId}
                            </TableCell>
                            <TableCell>
                                {editingId === c.id ? (
                                    <Form.Control
                                        type="text"
                                        size="sm"
                                        value={editText}
                                        onChange={e => setEditText(e.target.value)}
                                    />
                                ) : c.text}
                            </TableCell>
                            <TableCell>
                                <Badge bg="light" text="dark" className="border profile-theme-border">
                                    {ElementStatusEnum.getOptions(t).find(o => String(o.value) === String(c.status))?.label || c.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{formatDate(c.createdAt)}</TableCell>
                            <TableCell className="text-end">
                                <Stack direction="horizontal" className="justify-content-end gap-1 flex-wrap">
                                    {isOwner && editingId !== c.id && (
                                        <Button variant="outline-secondary" size="sm" className="py-0 px-2" disabled={isFeedLoading}
                                                onClick={() => startEdit(c.id, c.text)}>
                                            <BootstrapIcon name="pencil" />
                                        </Button>
                                    )}
                                    {isOwner && editingId === c.id && (
                                        <>
                                            <Button variant="success" size="sm" className="py-0 px-2" disabled={isFeedLoading}
                                                    onClick={() => saveEdit(c.id)}>
                                                <BootstrapIcon name="check" />
                                            </Button>
                                            <Button variant="danger" size="sm" className="py-0 px-2" disabled={isFeedLoading}
                                                    onClick={() => setEditingId(null)}>
                                                <BootstrapIcon name="x" />
                                            </Button>
                                        </>
                                    )}
                                    {isOwner && (
                                        <Button variant="outline-danger" size="sm" className="py-0 px-2" disabled={isFeedLoading}
                                                onClick={() => onDeleteComment(feedId, c.id)}>
                                            <BootstrapIcon name="trash" />
                                        </Button>
                                    )}
                                    {canChangeStatus && ElementStatusEnum.getOptions(t)
                                        .filter(opt => opt.value !== c.status)
                                        .filter(opt => opt.value !== ElementStatusEnum.REJECTED || isAdmin)
                                        .map(opt => (
                                            <Button
                                                key={opt.value}
                                                variant="profile-outline-primary"
                                                size="sm"
                                                className="py-0 px-2"
                                                disabled={isFeedLoading}
                                                onClick={() => onChangeStatus(c.id, opt.value)}
                                            >
                                                {opt.label}
                                            </Button>
                                        ))}
                                </Stack>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};