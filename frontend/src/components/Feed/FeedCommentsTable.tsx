import React, { useState } from 'react';
import { Table, Stack, Button, Form, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { FeedCommentResponse } from '../../api/responses/FeedCommentResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

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
    onDeleteComment,
    onUpdateComment,
    onChangeStatus,
}) => {
    const { t } = useTranslation();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    const saveEdit = (id: string) => {
        onUpdateComment(feedId, id, editText);
        setEditingId(null);
    };

    return (
        <Table responsive size="sm" borderless hover className="align-middle mb-0">
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
                        <TableCell colSpan={5} className="text-center text-muted">
                            {t('noRecords')}
                        </TableCell>
                    </TableRow>
                ) : (
                    comments.map((c) => {
                        const u = relatedUsers[c.userId];
                        const isOwner = currentUser?.id === c.userId;

                        return (
                            <TableRow key={c.id}>
                                <TableCell>
                                    {u ? (
                                        <Link to={`/users/${u.link}`} className="text-decoration-none">
                                            {u.firstName} {u.lastName}
                                        </Link>
                                    ) : (
                                        <Stack as="span" className="text-muted">
                                            {c.userId}
                                        </Stack>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editingId === c.id ? (
                                        <Form.Control
                                            size="sm"
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                        />
                                    ) : (
                                        c.text
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge bg="light" text="dark" className="border profile-theme-border">
                                        {ElementStatusEnum.getOptions(t).find((o) => o.value === c.status)?.label ||
                                            c.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="small text-muted">{formatDate(c.createdAt)}</TableCell>
                                <TableCell className="text-end">
                                    <Stack direction="horizontal" gap={1} className="justify-content-end flex-wrap">
                                        {isOwner &&
                                            (editingId === c.id ? (
                                                <>
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        className="py-0 px-2"
                                                        onClick={() => saveEdit(c.id)}
                                                    >
                                                        <BootstrapIcon name="check" />
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        className="py-0 px-2"
                                                        onClick={() => setEditingId(null)}
                                                    >
                                                        <BootstrapIcon name="x" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    className="py-0 px-2"
                                                    onClick={() => {
                                                        setEditingId(c.id);
                                                        setEditText(c.text);
                                                    }}
                                                >
                                                    <BootstrapIcon name="pencil" />
                                                </Button>
                                            ))}
                                        {isOwner && (
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                className="py-0 px-2"
                                                onClick={() => onDeleteComment(feedId, c.id)}
                                            >
                                                <BootstrapIcon name="trash" />
                                            </Button>
                                        )}
                                        {(isOwner || isAdmin) &&
                                            ElementStatusEnum.getOptions(t)
                                                .filter(
                                                    (opt) =>
                                                        opt.value !== c.status &&
                                                        (isAdmin || opt.value !== ElementStatusEnum.REJECTED),
                                                )
                                                .map((opt) => (
                                                    <Button
                                                        key={opt.value}
                                                        variant="profile-outline-primary"
                                                        size="sm"
                                                        className="py-0 px-2 btn-xs"
                                                        onClick={() => onChangeStatus(c.id, opt.value)}
                                                    >
                                                        {opt.label}
                                                    </Button>
                                                ))}
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        );
                    })
                )}
            </TableBody>
        </Table>
    );
};
