import React, { useState } from 'react';
import { Table, Stack, Button, Form, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { FeedReactionResponse } from '../../api/responses/FeedReactionResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { FeedReactionEnum } from '../../enums/FeedReactionEnum';
import { formatDate } from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import SelectOptions from '../Common/SelectOptions';
import { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

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
    onDeleteReaction,
    onUpdateReaction,
    onChangeStatus,
}) => {
    const { t } = useTranslation();
    const [editingId, setEditingId] = useState<string | null>(null);

    return (
        <Table responsive size="sm" borderless hover className="align-middle mb-0">
            <TableHead className="table-light">
                <TableRow>
                    <TableHeaderCell>{t('user')}</TableHeaderCell>
                    <TableHeaderCell>{t('reaction')}</TableHeaderCell>
                    <TableHeaderCell>{t('status')}</TableHeaderCell>
                    <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
                    <TableHeaderCell className="text-end">{t('manage')}</TableHeaderCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {reactions.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted">
                            {t('noRecords')}
                        </TableCell>
                    </TableRow>
                ) : (
                    reactions.map((r) => {
                        const u = relatedUsers[r.userId];
                        const isOwner = currentUser?.id === r.userId;

                        return (
                            <TableRow key={r.id}>
                                <TableCell>
                                    {u ? (
                                        <Link to={`/users/${u.link}`} className="text-decoration-none">
                                            {u.firstName} {u.lastName}
                                        </Link>
                                    ) : (
                                        <Stack as="span" className="text-muted">
                                            -{r.userId}
                                        </Stack>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editingId === r.id ? (
                                        <Form.Select
                                            size="sm"
                                            defaultValue={r.reaction}
                                            onChange={(e) => {
                                                onUpdateReaction(r.id, parseInt(e.target.value));
                                                setEditingId(null);
                                            }}
                                        >
                                            <SelectOptions options={FeedReactionEnum.getOptions(t)} />
                                        </Form.Select>
                                    ) : (
                                        FeedReactionEnum.getOptions(t).find((o) => o.value === r.reaction)?.label ||
                                        r.reaction
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge bg="light" text="dark" className="border profile-theme-border">
                                        {ElementStatusEnum.getOptions(t).find((o) => o.value === r.status)?.label ||
                                            r.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="small text-muted">{formatDate(r.createdAt)}</TableCell>
                                <TableCell className="text-end">
                                    <Stack direction="horizontal" gap={1} className="justify-content-end flex-wrap">
                                        {isOwner &&
                                            (editingId === r.id ? (
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    className="py-0 px-2"
                                                    onClick={() => setEditingId(null)}
                                                >
                                                    <BootstrapIcon name="x" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    className="py-0 px-2"
                                                    onClick={() => setEditingId(r.id)}
                                                >
                                                    <BootstrapIcon name="pencil" />
                                                </Button>
                                            ))}
                                        {isOwner && (
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                className="py-0 px-2"
                                                onClick={() => onDeleteReaction(r.id)}
                                            >
                                                <BootstrapIcon name="trash" />
                                            </Button>
                                        )}
                                        {(isOwner || isAdmin) &&
                                            ElementStatusEnum.getOptions(t)
                                                .filter(
                                                    (opt) =>
                                                        opt.value !== r.status &&
                                                        (isAdmin || opt.value !== ElementStatusEnum.REJECTED),
                                                )
                                                .map((opt) => (
                                                    <Button
                                                        key={opt.value}
                                                        variant="profile-outline-primary"
                                                        size="sm"
                                                        className="py-0 px-2 btn-xs"
                                                        onClick={() => onChangeStatus(r.id, opt.value)}
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
