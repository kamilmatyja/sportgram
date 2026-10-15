import React, { useState } from 'react';
import { Table, Stack, Button } from 'react-bootstrap';

import { FeedCommentResponse } from '../../api/responses/FeedCommentResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import { EnumBadge } from '../Common/EnumBadge';
import { InputField } from '../Common/FormFields';
import { StatusButtons } from '../Common/StatusButtons';
import { EmptyTableRow, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';
import { UserLink } from '../Common/UserLink';

interface FeedCommentsTableProps {
    feedId: string;
    comments: FeedCommentResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    isAdmin: boolean;
    isFeedLoading: boolean;
    onDeleteComment: (feedId: string, commentId: string) => void;
    onUpdateComment: (feedId: string, commentId: string, text: string) => Promise<boolean>;
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
    onChangeStatus,
}) => {
    const { t } = useTranslation();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const statusOptions = ElementStatusEnum.getOptions(t);
    const canSelectStatus = (status: number) => isAdmin || status !== ElementStatusEnum.REJECTED;

    const saveEdit = async (id: string) => {
        if (await onUpdateComment(feedId, id, editText)) {
            setEditingId(null);
        }
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
                    <EmptyTableRow colSpan={5} />
                ) : (
                    comments.map((c) => {
                        const isOwner = currentUser?.id === c.userId;

                        return (
                            <TableRow key={c.id}>
                                <TableCell>
                                    <UserLink user={relatedUsers[c.userId]} />
                                </TableCell>
                                <TableCell>
                                    {editingId === c.id ? (
                                        <InputField
                                            size="sm"
                                            name="text"
                                            aria-label={t('text')}
                                            value={editText}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                setEditText(e.target.value)
                                            }
                                        />
                                    ) : (
                                        c.text
                                    )}
                                </TableCell>
                                <TableCell>
                                    <EnumBadge options={statusOptions} value={c.status} />
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
                                                        disabled={isFeedLoading}
                                                        aria-label={t('save')}
                                                    >
                                                        <BootstrapIcon name="check" />
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        className="py-0 px-2"
                                                        onClick={() => setEditingId(null)}
                                                        aria-label={t('cancel')}
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
                                                    disabled={isFeedLoading}
                                                    aria-label={t('edit')}
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
                                                disabled={isFeedLoading}
                                                aria-label={t('delete')}
                                            >
                                                <BootstrapIcon name="trash" />
                                            </Button>
                                        )}
                                        {(isOwner || isAdmin) && (
                                            <StatusButtons
                                                options={statusOptions}
                                                current={c.status}
                                                canSelect={canSelectStatus}
                                                onSelect={(status) => onChangeStatus(c.id, status)}
                                                disabled={isFeedLoading}
                                            />
                                        )}
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
