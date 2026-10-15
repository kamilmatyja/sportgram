import React, { useState } from 'react';
import { Table, Stack, Button } from 'react-bootstrap';

import { FeedReactionResponse } from '../../api/responses/FeedReactionResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { FeedReactionEnum } from '../../enums/FeedReactionEnum';
import { formatDate } from '../../utils/dateFormat';
import { getOptionLabel } from '../../utils/options';
import BootstrapIcon from '../Common/BootstrapIcon';
import { EnumBadge } from '../Common/EnumBadge';
import { SelectField } from '../Common/FormFields';
import { StatusButtons } from '../Common/StatusButtons';
import { EmptyTableRow, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';
import { UserLink } from '../Common/UserLink';

interface FeedReactionsTableProps {
    reactions: FeedReactionResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    isAdmin: boolean;
    isFeedLoading: boolean;
    onDeleteReaction: (reactionId: string) => void;
    onUpdateReaction: (reactionId: string, type: number) => Promise<boolean>;
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
    onChangeStatus,
}) => {
    const { t } = useTranslation();
    const [editingId, setEditingId] = useState<string | null>(null);
    const statusOptions = ElementStatusEnum.getOptions(t);
    const reactionOptions = FeedReactionEnum.getOptions(t);
    const canSelectStatus = (status: number) => isAdmin || status !== ElementStatusEnum.REJECTED;

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
                    <EmptyTableRow colSpan={5} />
                ) : (
                    reactions.map((r) => {
                        const isOwner = currentUser?.id === r.userId;

                        return (
                            <TableRow key={r.id}>
                                <TableCell>
                                    <UserLink user={relatedUsers[r.userId]} />
                                </TableCell>
                                <TableCell>
                                    {editingId === r.id ? (
                                        <SelectField
                                            size="sm"
                                            name="type"
                                            aria-label={t('reaction')}
                                            defaultValue={r.reaction}
                                            disabled={isFeedLoading}
                                            onChange={async (e: React.ChangeEvent<HTMLSelectElement>) => {
                                                if (await onUpdateReaction(r.id, parseInt(e.target.value))) {
                                                    setEditingId(null);
                                                }
                                            }}
                                            options={reactionOptions}
                                        />
                                    ) : (
                                        getOptionLabel(reactionOptions, r.reaction)
                                    )}
                                </TableCell>
                                <TableCell>
                                    <EnumBadge options={statusOptions} value={r.status} />
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
                                                    aria-label={t('cancel')}
                                                >
                                                    <BootstrapIcon name="x" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    className="py-0 px-2"
                                                    onClick={() => setEditingId(r.id)}
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
                                                onClick={() => onDeleteReaction(r.id)}
                                                disabled={isFeedLoading}
                                                aria-label={t('delete')}
                                            >
                                                <BootstrapIcon name="trash" />
                                            </Button>
                                        )}
                                        {(isOwner || isAdmin) && (
                                            <StatusButtons
                                                options={statusOptions}
                                                current={r.status}
                                                canSelect={canSelectStatus}
                                                onSelect={(status) => onChangeStatus(r.id, status)}
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
