import React, {useState} from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {FeedResponse} from '../../api/responses/FeedResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import {ElementStatusEnum} from '../../enums/ElementStatusEnum';
import {formatDate} from '../../utils/dateFormat';
import {FeedCommentsTable} from './FeedCommentsTable';
import {FeedReactionsTable} from './FeedReactionsTable';
import BootstrapIcon from '../Common/BootstrapIcon';
import {TableHead, TableBody, TableRow, TableHeaderCell, TableCell} from '../Common/Table';
import {Stack, Table, Image, Badge, Button, Card, Nav} from 'react-bootstrap';

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
                                                                  feeds,
                                                                  relatedUsers,
                                                                  currentUser,
                                                                  isMyProfile,
                                                                  isAdmin,
                                                                  actionLoading,
                                                                  onManageClick,
                                                                  interactions
                                                              }) => {
    const {t} = useTranslation();
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'comments' | 'reactions'>('comments');

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

    return (
        <Stack className="table-responsive-custom">
            <Table bordered hover className="align-middle mb-0">
                <TableHead className="table-light">
                    <TableRow>
                        <TableHeaderCell>{t('photo')}</TableHeaderCell>
                        <TableHeaderCell>{t('type')}</TableHeaderCell>
                        <TableHeaderCell>{t('text')}</TableHeaderCell>
                        <TableHeaderCell>{t('status')}</TableHeaderCell>
                        <TableHeaderCell>{t('createdAt')}</TableHeaderCell>
                        <TableHeaderCell>{t('details')}</TableHeaderCell>
                        <TableHeaderCell />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {feeds.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted">{t('noRecords')}</TableCell>
                        </TableRow>
                    ) : feeds.map(feed => (
                        <React.Fragment key={feed.id}>
                            <TableRow>
                                <TableCell className="text-center feed-photo-cell">
                                    {feed.photo ? (
                                        <Image src={`data:image/webp;base64,${feed.photo}`} alt="feed" rounded className="img-fluid feed-photo" />
                                    ) : (
                                        <Stack as="span" className="text-muted">-</Stack>
                                    )}
                                </TableCell>
                                <TableCell>{getFeedTypeLabel(feed)}</TableCell>
                                <TableCell>{feed.text}</TableCell>
                                <TableCell>
                                    <Badge bg="light" text="dark" className="border profile-theme-border">
                                        {ElementStatusEnum.getOptions(t).find(opt => String(opt.value) === String(feed.status))?.label || feed.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{formatDate(feed.createdAt)}</TableCell>
                                <TableCell>
                                    <Button variant="outline-secondary" size="sm" onClick={() => toggleRow(feed.id)}>
                                        <BootstrapIcon name={expandedRow === feed.id ? 'chevron-up' : 'chevron-down'} /> {t('comments')} / {t('reactions')}
                                    </Button>
                                </TableCell>
                                <TableCell className="text-end">
                                    {(isMyProfile || isAdmin) && (
                                        <Button variant="profile-outline-primary" size="sm" title={t('manage')} onClick={() => onManageClick(feed)}>
                                            <BootstrapIcon name="gear" />
                                            <Stack as="span" className="visually-hidden">{t('manage')}</Stack>
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                            {expandedRow === feed.id && (
                                <TableRow className="bg-light">
                                    <TableCell colSpan={7} className="p-3">
                                        <Card className="border rounded border-profile-primary bg-white overflow-hidden">
                                            <Nav variant="tabs" className="px-3 pt-2 bg-light border-bottom">
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
                                            <Card.Body className="p-3">
                                                {activeTab === 'comments' ? (
                                                    <FeedCommentsTable
                                                        feedId={feed.id}
                                                        comments={feed.comments || []}
                                                        relatedUsers={relatedUsers}
                                                        currentUser={currentUser}
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
                                                        isAdmin={isAdmin}
                                                        isFeedLoading={actionLoading === feed.id}
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
                    ))}
                </TableBody>
            </Table>
        </Stack>
    );
};