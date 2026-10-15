import React, { useState } from 'react';
import { Stack, Table, Button, Card, Nav } from 'react-bootstrap';

import { getFeedTypeLabel } from './FeedCard';
import { FeedCommentsTable } from './FeedCommentsTable';
import { FeedReactionsTable } from './FeedReactionsTable';
import { FeedResponse } from '../../api/responses/FeedResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { type FeedInteractions } from '../../services/Feed/useFeedInteractions';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { formatDate } from '../../utils/dateFormat';
import { Base64Image } from '../Common/Base64Image';
import BootstrapIcon from '../Common/BootstrapIcon';
import { EnumBadge } from '../Common/EnumBadge';
import { FormErrorAlert } from '../Common/FormFields';
import { IconButton } from '../Common/IconButton';
import { EmptyTableRow, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Common/Table';

interface UserFeedsTableProps {
    feeds: FeedResponse[];
    relatedUsers: Record<string, UserResponse>;
    currentUser: UserResponse | null;
    isMyProfile: boolean;
    isAdmin: boolean;
    actionLoading: string | null;
    onManageClick: (feed: FeedResponse) => void;
    interactions: FeedInteractions;
}

export const UserFeedsTable: React.FC<UserFeedsTableProps> = ({
    feeds,
    relatedUsers,
    currentUser,
    isMyProfile,
    isAdmin,
    actionLoading,
    onManageClick,
    interactions,
}) => {
    const { t } = useTranslation();
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'comments' | 'reactions'>('comments');

    return (
        <Stack className="table-responsive-custom">
            <FormErrorAlert error={interactions.actionError} />
            <Table bordered hover className="align-middle mb-0 shadow-sm">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('photo')}</TableHeaderCell>
                        <TableHeaderCell>{t('type')}</TableHeaderCell>
                        <TableHeaderCell>{t('text')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
                        <TableHeaderCell>{t('details')}</TableHeaderCell>
                        <TableHeaderCell className="text-end" />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {feeds.length === 0 ? (
                        <EmptyTableRow colSpan={7} />
                    ) : (
                        feeds.map((feed) => (
                            <React.Fragment key={feed.id}>
                                <TableRow>
                                    <TableCell className="text-center feed-photo-cell">
                                        <Base64Image
                                            data={feed.photo}
                                            fallback={
                                                <Stack as="span" className="text-muted">
                                                    -
                                                </Stack>
                                            }
                                            rounded
                                            className="feed-photo shadow-sm"
                                        />
                                    </TableCell>
                                    <TableCell className="small fw-bold">{getFeedTypeLabel(feed, t)}</TableCell>
                                    <TableCell className="small">{feed.text}</TableCell>
                                    <TableCell>
                                        <EnumBadge options={ElementStatusEnum.getOptions(t)} value={feed.status} />
                                    </TableCell>
                                    <TableCell className="small text-muted">{formatDate(feed.createdAt)}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => setExpandedRow(expandedRow === feed.id ? null : feed.id)}
                                        >
                                            <BootstrapIcon
                                                name={expandedRow === feed.id ? 'chevron-up' : 'chevron-down'}
                                                className="me-1"
                                            />
                                            {t('comments')} / {t('reactions')}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-end">
                                        {(isMyProfile || isAdmin) && (
                                            <IconButton icon="gear" onClick={() => onManageClick(feed)} />
                                        )}
                                    </TableCell>
                                </TableRow>
                                {expandedRow === feed.id && (
                                    <TableRow className="bg-light">
                                        <TableCell colSpan={7} className="p-3">
                                            <Card className="border-profile-primary shadow-sm overflow-hidden">
                                                <Nav variant="tabs" className="px-3 pt-2 bg-light border-bottom-0">
                                                    <Nav.Item>
                                                        <Button
                                                            variant="link"
                                                            className={`nav-link text-decoration-none ${activeTab === 'comments' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`}
                                                            onClick={() => setActiveTab('comments')}
                                                        >
                                                            {t('comments')} ({feed.comments?.length || 0})
                                                        </Button>
                                                    </Nav.Item>
                                                    <Nav.Item>
                                                        <Button
                                                            variant="link"
                                                            className={`nav-link text-decoration-none ${activeTab === 'reactions' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`}
                                                            onClick={() => setActiveTab('reactions')}
                                                        >
                                                            {t('reactions')} ({feed.reactions?.length || 0})
                                                        </Button>
                                                    </Nav.Item>
                                                </Nav>
                                                <Card.Body className="bg-white">
                                                    {activeTab === 'comments' ? (
                                                        <FeedCommentsTable
                                                            feedId={feed.id}
                                                            comments={feed.comments || []}
                                                            relatedUsers={relatedUsers}
                                                            currentUser={currentUser}
                                                            isAdmin={isAdmin}
                                                            isFeedLoading={actionLoading !== null}
                                                            onDeleteComment={interactions.handleDeleteComment}
                                                            onUpdateComment={interactions.handleUpdateTableComment}
                                                            onChangeStatus={interactions.handleCommentStatusSubmit}
                                                        />
                                                    ) : (
                                                        <FeedReactionsTable
                                                            reactions={feed.reactions || []}
                                                            relatedUsers={relatedUsers}
                                                            currentUser={currentUser}
                                                            isAdmin={isAdmin}
                                                            isFeedLoading={actionLoading !== null}
                                                            onDeleteReaction={interactions.handleDeleteReaction}
                                                            onUpdateReaction={interactions.handleUpdateReaction}
                                                            onChangeStatus={interactions.handleReactionStatusSubmit}
                                                        />
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))
                    )}
                </TableBody>
            </Table>
        </Stack>
    );
};
